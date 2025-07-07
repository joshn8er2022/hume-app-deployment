import { useSearchParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, MessageSquare, ArrowRight, Star } from "lucide-react"

export function ConfirmationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const applicationType = searchParams.get('type') || 'clinical'
  const applicationId = searchParams.get('applicationId')

  const getTypeSpecificContent = () => {
    switch (applicationType) {
      case 'clinical':
        return {
          title: 'Clinical Application Received',
          description: 'Thank you for your interest in Hume Connect for your clinical practice.',
          nextSteps: [
            'Our clinical team will review your application within 24 hours',
            'You\'ll receive a personalized demo invitation via email',
            'We\'ll schedule a consultation call to discuss your specific needs',
            'Our technical team will assess integration requirements'
          ],
          caseStudies: [
            {
              title: 'Diabetes Care Center Success',
              metric: '45% increase in patient engagement',
              description: 'How Dr. Johnson transformed patient outcomes with automated monitoring'
            },
            {
              title: 'Wellness Practice Growth',
              metric: '60% reduction in admin time',
              description: 'Streamlined operations led to 30% practice growth in 6 months'
            }
          ]
        }
      case 'affiliate':
        return {
          title: 'Affiliate Application Received',
          description: 'Welcome to the Hume Connect affiliate program.',
          nextSteps: [
            'Our partnership team will review your application within 48 hours',
            'You\'ll receive affiliate program details and commission structure',
            'Access to marketing materials and training resources',
            'Onboarding call to set up your affiliate account'
          ],
          caseStudies: [
            {
              title: 'Healthcare Consultant Success',
              metric: '$15,000 monthly commissions',
              description: 'How Sarah built a recurring revenue stream with our program'
            },
            {
              title: 'Marketing Agency Partnership',
              metric: '25 successful referrals',
              description: 'Agency generated $75,000 in commissions in first quarter'
            }
          ]
        }
      case 'wholesale':
        return {
          title: 'Wholesale Application Received',
          description: 'Thank you for your interest in our wholesale program.',
          nextSteps: [
            'Our wholesale team will review your application within 24 hours',
            'You\'ll receive volume pricing and product catalog',
            'Discussion of minimum order quantities and terms',
            'Setup of your wholesale account and ordering system'
          ],
          caseStudies: [
            {
              title: 'Medical Distributor Success',
              metric: '200+ units monthly',
              description: 'How MedTech Solutions scaled their Hume Connect distribution'
            },
            {
              title: 'Retail Partnership Growth',
              metric: '40% margin improvement',
              description: 'Healthcare retailer increased profitability with our products'
            }
          ]
        }
      default:
        return {
          title: 'Application Received',
          description: 'Thank you for your application.',
          nextSteps: [],
          caseStudies: []
        }
    }
  }

  const content = getTypeSpecificContent()

  const faqs = [
    {
      question: 'How long does the review process take?',
      answer: 'Most applications are reviewed within 24-48 hours. You\'ll receive an email confirmation once the review is complete.'
    },
    {
      question: 'What happens after approval?',
      answer: 'You\'ll receive a welcome email with next steps, including scheduling your onboarding call and accessing your account.'
    },
    {
      question: 'Can I track my application status?',
      answer: 'Yes, you\'ll receive email updates at each stage of the process. You can also contact our support team for status updates.'
    },
    {
      question: 'What if I have additional questions?',
      answer: 'Our support team is available 24/7 via email, phone, or chat. We\'re here to help with any questions or concerns.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {content.title}
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              {content.description}
            </p>

            {applicationId && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 text-sm">
                Application ID: {applicationId}
              </Badge>
            )}
            {!applicationId && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2 text-sm">
                Application ID: HC-{Date.now().toString().slice(-6)}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {content.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Case Studies */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {content.caseStudies.map((study, index) => (
              <Card key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {study.metric}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 dark:text-slate-300">{study.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Need Immediate Assistance?</h3>
            <p className="text-blue-100 mb-6">
              Our team is here to help with any questions or concerns you may have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = 'mailto:support@humeconnect.com'}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Email Support
              </Button>
              <Button
                variant="secondary"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = 'tel:+1-800-HUME-CONNECT'}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/landing')}
            variant="outline"
            className="hover:bg-blue-50 dark:hover:bg-slate-800"
          >
            Return to Landing Page
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
