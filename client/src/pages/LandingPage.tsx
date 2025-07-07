import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, ShoppingCart, ArrowRight, CheckCircle } from "lucide-react"
import { recordPageView } from "@/api/analytics"

export function LandingPage() {
  const [selectedOption, setSelectedOption] = useState("")
  const navigate = useNavigate()

  // Track page view on component mount
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await recordPageView({
          landingPageId: 'main-landing',
          landingPageName: 'Main Landing Page',
          landingPageUrl: window.location.pathname,
          referrer: document.referrer,
          sessionId: sessionStorage.getItem('sessionId') || Date.now().toString()
        })
      } catch (error) {
        console.error('Error tracking page view:', error)
        // Don't show error to user for tracking failures
      }
    }

    trackPageView()
  }, [])

  const handleContinue = () => {
    switch (selectedOption) {
      case "affiliate":
        navigate("/apply?type=affiliate")
        break
      case "clinical":
        navigate("/clinic")
        break
      case "wholesale":
        navigate("/apply?type=wholesale")
        break
      default:
        break
    }
  }

  const features = [
    "AI-powered client journey optimization",
    "Automated lead qualification and scoring", 
    "Personalized communication sequences",
    "Real-time analytics and insights",
    "Seamless integration with existing systems"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hume Connect
            </h1>
          </div>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
            Transform your client acquisition and onboarding journey with our intelligent, 
            personalized system that maximizes conversion rates and improves client experience.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Affiliate Partnership</CardTitle>
                <CardDescription>
                  Join our network and earn commissions by referring clients
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Clinical Application</CardTitle>
                <CardDescription>
                  Integrate our solutions into your clinical practice
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <ShoppingCart className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Wholesale Buying</CardTitle>
                <CardDescription>
                  Purchase our products in bulk for your business
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="max-w-2xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Get Started Today</CardTitle>
              <CardDescription className="text-center">
                Choose your path and let us customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select value={selectedOption} onValueChange={setSelectedOption}>
                <SelectTrigger className="w-full h-12 text-lg">
                  <SelectValue placeholder="Select your interest..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="affiliate">I'm interested in becoming an affiliate</SelectItem>
                  <SelectItem value="clinical">I'm interested in using this for clinical application</SelectItem>
                  <SelectItem value="wholesale">I'm interested in buying these products as a wholesale buyer</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleContinue}
                disabled={!selectedOption}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <div className="mt-16 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8">Why Choose Hume Connect?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-200/50">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
