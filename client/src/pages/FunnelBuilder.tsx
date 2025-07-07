import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Eye,
  Edit,
  BarChart3,
  Users,
  TrendingUp,
  MousePointer
} from "lucide-react"
import { getLandingPages, createLandingPage, getFunnelAnalytics } from "@/api/funnels"
import { useToast } from "@/hooks/useToast"
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface LandingPage {
  _id: string
  name: string
  slug: string
  url: string
  leadType: string
  status: string
  views: number
  conversions: number
  conversionRate: number
  createdAt: string
  updatedAt: string
}

interface FunnelStage {
  name: string
  count: number
  conversion: number
}

interface LeadTypeData {
  conversions: number
  views: number
  revenue: number
}

interface FunnelData {
  funnelData: {
    stages: FunnelStage[]
    byLeadType: Record<string, LeadTypeData>
  }
}

export function FunnelBuilder() {
  const [pages, setPages] = useState<LandingPage[]>([])
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPage, setNewPage] = useState({
    name: '',
    slug: '',
    leadType: 'clinical'
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesData, analyticsData] = await Promise.all([
          getLandingPages(),
          getFunnelAnalytics()
        ])
        setPages(pagesData.pages)
        setFunnelData(analyticsData)
      } catch (error) {
        console.error('Error fetching funnel data:', error)
        toast({
          title: "Error Loading Data",
          description: "Failed to load funnel data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleCreatePage = async () => {
    try {
      const result = await createLandingPage(newPage)
      setPages(prev => [...prev, result.page])
      setNewPage({ name: '', slug: '', leadType: 'clinical' })
      toast({
        title: "Page Created",
        description: "Landing page created successfully.",
      })
    } catch (error) {
      console.error('Error creating page:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create landing page. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'paused':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Funnel Builder
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              New Landing Page
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle>Create Landing Page</DialogTitle>
              <DialogDescription>
                Create a new landing page for your funnel
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  value={newPage.name}
                  onChange={(e) => setNewPage({...newPage, name: e.target.value})}
                  placeholder="Enter page name"
                />
              </div>
              <div>
                <Label htmlFor="pageSlug">URL Slug</Label>
                <Input
                  id="pageSlug"
                  value={newPage.slug}
                  onChange={(e) => setNewPage({...newPage, slug: e.target.value})}
                  placeholder="Enter URL slug"
                />
              </div>
              <div>
                <Label htmlFor="leadType">Lead Type</Label>
                <Select value={newPage.leadType} onValueChange={(value) => setNewPage({...newPage, leadType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinical">Clinical</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreatePage} className="w-full">
                Create Page
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pages">Landing Pages</TabsTrigger>
          <TabsTrigger value="analytics">Funnel Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          {/* Landing Pages Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Card key={page._id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{page.name}</CardTitle>
                    <Badge className={getStatusColor(page.status)}>
                      {page.status}
                    </Badge>
                  </div>
                  <CardDescription>/{page.slug}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span>{page.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-green-600" />
                      <span>{page.conversions} conversions</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Conversion Rate</span>
                      <span>{page.conversionRate}%</span>
                    </div>
                    <Progress value={page.conversionRate} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Funnel Overview */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Conversion Funnel
              </CardTitle>
              <CardDescription>Track users through your funnel stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData?.funnelData?.stages?.map((stage, index) => (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Badge className={`${index === 0 ? 'bg-blue-100 text-blue-800' :
                          index === 1 ? 'bg-green-100 text-green-800' :
                          index === 2 ? 'bg-yellow-100 text-yellow-800' :
                          index === 3 ? 'bg-purple-100 text-purple-800' :
                          index === 4 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'}`}>
                          {stage.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {stage.count} users
                        </span>
                      </div>
                      <span className="text-sm font-medium">{stage.conversion}%</span>
                    </div>
                    <Progress value={stage.conversion} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Type Performance */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Performance by Lead Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(funnelData?.funnelData?.byLeadType || {}).map(([key, value]) => ({
                        name: key,
                        value: value.conversions,
                        views: value.views,
                        revenue: value.revenue
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(funnelData?.funnelData?.byLeadType || {}).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Page Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pages.slice(0, 3).map((page) => (
                    <div key={page._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="font-medium">{page.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {page.views} views • {page.conversions} conversions
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{page.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">conversion rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
