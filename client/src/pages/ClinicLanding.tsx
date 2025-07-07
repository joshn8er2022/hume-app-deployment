import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Play, 
  Pause, 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Clock,
  Star,
  Building2,
  Phone,
  Mail
} from "lucide-react"
import { recordPageView } from "@/api/analytics"

export function ClinicLanding() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [watchProgress, setWatchProgress] = useState(0)
  const [showApplication, setShowApplication] = useState(false)
  const navigate = useNavigate()

  // Track page view on component mount
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await recordPageView({
          landingPageId: 'clinic-landing',
          landingPageName: 'Clinic Landing Page',
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

  // Simulate video progress
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setWatchProgress(prev => {
          const newProgress = prev + 1
          // Show application button after 30% progress
          if (newProgress >= 30 && !showApplication) {
            setShowApplication(true)
          }
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 200) // Simulate 20 second video
    }
    return () => clearInterval(interval)
  }, [isPlaying, showApplication])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleApplyNow = () => {
    navigate("/apply?type=clinical")
  }

  const benefits = [
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Increase Patient Engagement",
      description: "Boost patient interaction by 300% with personalized health insights"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      title: "Improve Clinical Outcomes",
      description: "Data-driven insights lead to better treatment decisions and outcomes"
    },
    {
      icon: <Clock className="h-6 w-6 text-purple-600" />,
      title: "Save Time & Resources",
      description: "Automate routine assessments and focus on what matters most"
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "Family Medicine Physician",
      clinic: "Johnson Family Health",
      quote: "Hume Connect has revolutionized how we engage with our patients. The insights are incredible.",
      rating: 5
    },
    {
      name: "Dr. Michael Chen",
      role: "Wellness Director",
      clinic: "Optimal Health Center",
      quote: "Our patient satisfaction scores increased by 40% after implementing Hume Connect.",
      rating: 5
    }
  ]

  const faqs = [
    {
      question: "How quickly can we get started?",
      answer: "Most clinics are up and running within 48 hours of approval. Our team handles all the technical setup."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide 24/7 technical support, training for your staff, and ongoing optimization consultations."
    },
    {
      question: "Is the system HIPAA compliant?",
      answer: "Yes, Hume Connect is fully HIPAA compliant with enterprise-grade security and encryption."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building2 className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Hume Connect for Clinics
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Transform your clinical practice with AI-powered patient engagement and personalized health insights
          </p>
        </div>

        {/* Video Section */}
        <Card className="max-w-4xl mx-auto mb-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">See How Hume Connect Works</CardTitle>
            <CardDescription className="text-center">
              Watch this brief overview to understand how we can transform your practice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Video Player Mockup */}
            <div className="relative bg-slate-900 rounded-lg aspect-video flex items-center justify-center">
              <Button
                onClick={handlePlayPause}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16"
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
              {watchProgress > 0 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Progress value={watchProgress} className="h-2" />
                </div>
              )}
            </div>

            {/* Progress Info */}
            {watchProgress > 0 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Video Progress: {watchProgress}%
                </p>
                {watchProgress >= 30 && !showApplication && (
                  <p className="text-sm text-green-600 font-medium">
                    Application button will appear soon...
                  </p>
                )}
              </div>
            )}

            {/* Application Button */}
            {showApplication && (
              <div className="text-center">
                <Button
                  onClick={handleApplyNow}
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Ready to transform your practice? Start your application now.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Clinics Choose Hume Connect</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Clinic Partners Say</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>
                    {testimonial.role} • {testimonial.clinic}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="max-w-2xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription>
              Join hundreds of clinics already using Hume Connect to improve patient outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showApplication ? (
              <Button
                onClick={handleApplyNow}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Start Your Application <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-muted-foreground mb-2">
                  Watch at least 30% of the video above to unlock the application
                </p>
                <Progress value={watchProgress} className="w-full max-w-xs mx-auto" />
              </div>
            )}

            <div className="flex justify-center gap-8 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>1-800-HUME-CONNECT</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>clinics@humeconnect.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
