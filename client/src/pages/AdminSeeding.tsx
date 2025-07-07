import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/useToast"
import { Loader2, Database, Users, FileText, MessageSquare, CheckCircle, ArrowLeft } from "lucide-react"
import { seedAdminUser, seedTestData, getSeedStatus } from "@/api/seed"
import { useNavigate } from "react-router-dom"

interface SeedStatus {
  adminUserExists: boolean;
  counts: {
    users: number;
    leads: number;
    applications: number;
    communications: number;
  };
}

export function AdminSeeding() {
  const [seedingAdmin, setSeedingAdmin] = useState(false)
  const [seedingData, setSeedingData] = useState(false)
  const [status, setStatus] = useState<SeedStatus | null>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const loadStatus = async () => {
    try {
      const result = await getSeedStatus()
      setStatus(result.data)
    } catch (error) {
      console.error('Error loading seed status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load seed status';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const handleSeedAdmin = async () => {
    try {
      setSeedingAdmin(true)
      const result = await seedAdminUser()
      toast({
        title: "Success",
        description: result.message,
      })
      await loadStatus()
    } catch (error) {
      console.error('Error seeding admin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to seed admin user';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setSeedingAdmin(false)
    }
  }

  const handleSeedTestData = async () => {
    try {
      setSeedingData(true)
      const result = await seedTestData()
      toast({
        title: "Success",
        description: `${result.message}. Created: ${result.data.users} users, ${result.data.leads} leads, ${result.data.applications} applications, ${result.data.communications} communications`,
      })
      await loadStatus()
    } catch (error) {
      console.error('Error seeding test data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to seed test data';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setSeedingData(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Database Seeding</h1>
            <p className="text-muted-foreground">
              Initialize your database with admin user and sample data
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadStatus} variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button onClick={() => navigate('/login')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
        </div>

        {status && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Current Database Status
              </CardTitle>
              <CardDescription>
                Overview of seeded data in your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-4 w-4 ${status.adminUserExists ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-sm">Admin User</span>
                  <Badge variant={status.adminUserExists ? "default" : "secondary"}>
                    {status.adminUserExists ? "Created" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Users</span>
                  <Badge variant="outline">{status.counts.users}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Leads</span>
                  <Badge variant="outline">{status.counts.leads}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Applications</span>
                  <Badge variant="outline">{status.counts.applications}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Communications</span>
                  <Badge variant="outline">{status.counts.communications}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Admin User</CardTitle>
              <CardDescription>
                Create the initial admin user with credentials: admin@example.com / admin123
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p><strong>Email:</strong> admin@example.com</p>
                  <p><strong>Password:</strong> admin123</p>
                  <p><strong>Role:</strong> Admin</p>
                </div>
                <Button
                  onClick={handleSeedAdmin}
                  disabled={seedingAdmin}
                  className="w-full"
                >
                  {seedingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Admin User...
                    </>
                  ) : (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Create Admin User
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seed Test Data</CardTitle>
              <CardDescription>
                Create sample users, leads, applications, and communications for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>• Sample clinic, affiliate, and wholesale users</p>
                  <p>• Sample leads with different statuses</p>
                  <p>• Sample applications and communications</p>
                  <p>• Realistic test data for development</p>
                </div>
                <Button
                  onClick={handleSeedTestData}
                  disabled={seedingData}
                  className="w-full"
                  variant="outline"
                >
                  {seedingData ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Test Data...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Seed Test Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {status?.adminUserExists && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Admin user created successfully!</span>
              </div>
              <p className="text-green-700 mt-2">
                You can now log in with: <strong>admin@example.com</strong> / <strong>admin123</strong>
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="mt-4"
                variant="default"
              >
                Go to Login Page
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
