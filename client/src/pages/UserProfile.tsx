import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { getUserProfile, updateUserProfile } from "@/api/users"
import { User, Save } from "lucide-react"

type ProfileForm = {
  email: string
  firstName: string
  lastName: string
  companyName: string
  phone: string
  role: string
  subscriptionStatus: string
}

export function UserProfile() {
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const { toast } = useToast()
  const { register, handleSubmit, setValue, watch, reset } = useForm<ProfileForm>()

  const watchedRole = watch('role')
  const watchedSubscriptionStatus = watch('subscriptionStatus')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await getUserProfile()
      if (response.success) {
        const userData = response.data
        reset({
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          companyName: userData.companyName || '',
          phone: userData.phone || '',
          role: userData.role || 'clinic',
          subscriptionStatus: userData.subscriptionStatus || 'trial'
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load profile",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    try {
      setLoading(true)
      const response = await updateUserProfile(data)
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Profile updated successfully",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Loading Profile...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Update your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  {...register("firstName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  {...register("lastName")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...register("email", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Select value={watchedRole} onValueChange={(value) => setValue('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="wholesale">Wholesale</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionStatus">Subscription Status</Label>
              <Select value={watchedSubscriptionStatus} onValueChange={(value) => setValue('subscriptionStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Enter company name"
                {...register("companyName")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                {...register("phone")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Updating..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
