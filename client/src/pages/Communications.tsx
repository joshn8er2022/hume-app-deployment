import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Building2,
  Clock,
  MessageCircle,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import { getCommunications, createCampaign, getCampaignStatistics, deleteCampaign } from "@/api/communications"
import { useToast } from "@/hooks/useToast"

interface Communication {
  _id: string
  type: 'email' | 'sms' | 'call' | 'chat'
  subject: string
  content: string
  recipient: {
    _id: string
    name: string
    email: string
    company: string
  }
  rep: string
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'completed'
  timestamp: string
  campaign?: string
  recordingUrl?: string
  duration?: string
}

interface Contact {
  _id: string
  name: string
  email: string
  company: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

interface Campaign {
  _id: string
  name: string
  type: string
  status: string
  recipients: number
  openRate: number
  responseRate: number
  createdAt: string
}

export function Communications() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [repFilter, setRepFilter] = useState("all")
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    recipients: []
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        const data = await getCommunications({
          type: typeFilter,
          rep: repFilter,
          contactId: selectedContact
        })
        setCommunications(data.communications)
        setContacts(data.contacts)
        setCampaigns(data.campaigns)
      } catch (error) {
        console.error('Error fetching communications:', error)
        toast({
          title: "Error Loading Communications",
          description: "Failed to load communications data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCommunications()
  }, [typeFilter, repFilter, selectedContact, toast])


  const handleCreateCampaign = async () => {
    try {
      await createCampaign(newCampaign)
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created and will be sent shortly.",
      })
      setNewCampaign({ name: '', type: 'email', subject: '', content: '', recipients: [] })
      setShowCampaignDialog(false)
      const data = await getCommunications({ type: typeFilter, rep: repFilter, contactId: selectedContact })
      setCampaigns(data.campaigns)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast({
        title: "Failed to Create Campaign",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleViewCampaignDetails = async (campaign: Campaign) => {
    try {
      const statsData = await getCampaignStatistics(campaign._id)
      toast({
        title: "Campaign Statistics",
        description: `Open Rate: ${statsData.statistics.openRate}%, Response Rate: ${statsData.statistics.responseRate}%`,
      })
    } catch (error) {
      console.error('Error fetching campaign statistics:', error)
      toast({
        title: "Error Loading Statistics",
        description: "Failed to load campaign statistics. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditCampaign = () => {
    toast({
      title: "Edit Campaign",
      description: "Campaign editing functionality will be implemented soon.",
    })
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId)
      toast({
        title: "Campaign Deleted",
        description: "Campaign has been deleted successfully.",
      })
      const data = await getCommunications({ type: typeFilter, rep: repFilter, contactId: selectedContact })
      setCampaigns(data.campaigns)
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast({
        title: "Failed to Delete Campaign",
        description: "Failed to delete campaign. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'opened':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'replied':
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'chat':
        return <MessageCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const uniqueReps = [...new Set(communications.map(comm => comm.rep))]

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
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <Card className="w-80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Contacts
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-1 p-4">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => setSelectedContact(contact._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 ${selectedContact === contact._id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{contact.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{contact.company}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{contact.lastMessage}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-muted-foreground">{contact.lastMessageTime}</div>
                      {contact.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center">
                          {contact.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Communications Hub
          </h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => setShowCampaignDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search messages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={repFilter} onValueChange={setRepFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by rep" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Reps</SelectItem>
                      {uniqueReps.map((rep) => (
                        <SelectItem key={rep} value={rep}>{rep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle>Messages ({filteredCommunications.length})</CardTitle>
                <CardDescription>View and manage all communication history</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="space-y-4">
                    {filteredCommunications.map((comm) => (
                      <div key={comm._id} className="flex items-start gap-4 p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          {getTypeIcon(comm.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{comm.subject}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{comm.recipient.name}</span>
                                <Building2 className="h-3 w-3 ml-2" />
                                <span>{comm.recipient.company}</span>
                                <span className="ml-2">• Rep: {comm.rep}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(comm.status)}>
                                {comm.status}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{comm.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {comm.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.filter(c => c.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                  <User className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.reduce((sum, c) => sum + c.recipients, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
                  <Mail className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length) : 0}%
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Rate</CardTitle>
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {campaigns.length > 0 ? Math.round(campaigns.reduce((sum, c) => sum + c.responseRate, 0) / campaigns.length) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
              <CardHeader>
                <CardTitle>Campaigns ({campaigns.length})</CardTitle>
                <CardDescription>Manage your communication campaigns and track performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign._id} className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-slate-700/50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{campaign.name}</h4>
                          <Badge className={campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{campaign.recipients} recipients</span>
                          <span>{campaign.openRate}% open rate</span>
                          <span>{campaign.responseRate}% response rate</span>
                          <span>Created {campaign.createdAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCampaignDetails(campaign)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCampaign()}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>Create a new communication campaign for multiple recipients</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaignType">Campaign Type</Label>
                <Select value={newCampaign.type} onValueChange={(value) => setNewCampaign({...newCampaign, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Campaign</SelectItem>
                    <SelectItem value="sms">SMS Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="campaignSubject">Subject</Label>
              <Input
                id="campaignSubject"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                placeholder="Enter campaign subject"
              />
            </div>
            <div>
              <Label htmlFor="campaignContent">Campaign Content</Label>
              <Textarea
                id="campaignContent"
                value={newCampaign.content}
                onChange={(e) => setNewCampaign({...newCampaign, content: e.target.value})}
                placeholder="Enter campaign content..."
                rows={6}
              />
            </div>
            <Button onClick={handleCreateCampaign} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
