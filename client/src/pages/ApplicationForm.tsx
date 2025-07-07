import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, CheckCircle, Building2 } from "lucide-react"
import { submitApplication } from "@/api/applications"
import { useToast } from "@/hooks/useToast"

export function ApplicationForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Fix URL parameter parsing
  const getApplicationType = () => {
    const type = searchParams.get('type')

    if (!type) {
      return 'clinical'
    }

    // Clean up the type parameter (remove any extra query parameters)
    const cleanType = type.split('?')[0].toLowerCase()

    // Validate the type
    const validTypes = ['clinical', 'affiliate', 'wholesale']
    const finalType = validTypes.includes(cleanType) ? cleanType : 'clinical'

    return finalType
  }

  const [applicationType] = useState(getApplicationType())
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Business Information
    companyName: '',
    businessType: '',
    yearsInBusiness: '',
    currentPatients: '',
    monthlyRevenue: '',
    website: '',

    // Requirements
    primaryGoals: [] as string[],
    currentChallenges: '',
    timeline: '',
    budget: '',
    additionalInfo: '',

    // Agreement
    agreedToTerms: false,
    marketingConsent: false
  })

  useEffect(() => {
    // Component mounted
  }, [applicationType, searchParams])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      primaryGoals: prev.primaryGoals.includes(goal)
        ? prev.primaryGoals.filter(g => g !== goal)
        : [...prev.primaryGoals, goal]
    }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const extractErrorMessage = (error: any): string => {
    // Axios or fetch with JSON error response
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    // Fetch API with JSON error
    if (error?.data?.error) {
      return error.data.error;
    }
    // If error is a string
    if (typeof error === 'string') {
      return error;
    }
    // If error is an Error instance
    if (error instanceof Error && error.message) {
      return error.message;
    }
    // If error is an object (avoid [object Object])
    if (typeof error === 'object') {
      return JSON.stringify(error);
    }
    // Fallback
    return 'Unknown error';
  };

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required personal information fields.')
      }

      if (!formData.companyName || !formData.businessType || !formData.yearsInBusiness) {
        throw new Error('Please fill in all required business information fields.')
      }

      if (!formData.currentChallenges || formData.currentChallenges.trim().length < 10) {
        throw new Error('Please describe your current challenges (minimum 10 characters).')
      }

      if (!formData.primaryGoals || formData.primaryGoals.length === 0) {
        throw new Error('Please select at least one primary goal.')
      }

      if (!formData.timeline) {
        throw new Error('Please select an implementation timeline.')
      }

      if (!formData.agreedToTerms) {
        throw new Error('Please agree to the terms and conditions.')
      }

      const applicationData = {
        applicationType,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        businessInfo: {
          companyName: formData.companyName,
          businessType: mapBusinessTypeToBackend(formData.businessType),
          yearsInBusiness: formData.yearsInBusiness,
          currentPatients: formData.currentPatients,
          monthlyRevenue: formData.monthlyRevenue,
          website: formData.website
        },
        requirements: {
          primaryGoals: formData.primaryGoals,
          currentChallenges: formData.currentChallenges,
          timeline: formData.timeline,
          budget: formData.budget,
          additionalInfo: formData.additionalInfo
        },
        agreements: {
          agreedToTerms: formData.agreedToTerms,
          marketingConsent: formData.marketingConsent
        }
      }

      const response = await submitApplication(applicationData)

      toast({
        title: "Application Submitted Successfully!",
        description: "We'll review your application and get back to you within 24 hours.",
      })

      // Navigate to confirmation page with application ID
      navigate(`/confirmation?type=${applicationType}&id=${response.data._id}`)
    } catch (error: any) {
      console.error('Error submitting application:', error)
      const errorMsg = extractErrorMessage(error)
      toast({
        title: "Error Submitting Application",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getBusinessTypeOptions = () => {
    switch (applicationType) {
      case 'clinical':
        return [
          'Diabetic Practice',
          'General Wellness Practice',
          'Longevity Practice',
          'GLP-1 Practice',
          'Telehealth Company',
          'Other Specialty Practice'
        ];
      case 'affiliate':
        return [
          'Marketing Agency',
          'Health Coach',
          'Wellness Influencer',
          'Business Consultant',
          'Other'
        ];
      case 'wholesale':
        return [
          'Medical Equipment Distributor',
          'Health Product Retailer',
          'Wellness Center Chain',
          'Corporate Wellness Provider',
          'Other'
        ];
      default:
        return ['Other'];
    }
  }

  const mapBusinessTypeToBackend = (displayName: string) => {
    const mapping = {
      'Diabetic Practice': 'diabetic',
      'General Wellness Practice': 'wellness',
      'Longevity Practice': 'longevity',
      'GLP-1 Practice': 'glp1',
      'Telehealth Company': 'telehealth',
      'Other Specialty Practice': 'other',
      'Marketing Agency': 'affiliate',
      'Health Coach': 'health-coach',
      'Wellness Influencer': 'wellness-influencer',
      'Business Consultant': 'affiliate',
      'Medical Equipment Distributor': 'wholesale',
      'Health Product Retailer': 'wholesale',
      'Wellness Center Chain': 'wellness',
      'Corporate Wellness Provider': 'wellness',
      'Other': 'other'
    }
    return mapping[displayName as keyof typeof mapping] || 'other'
  }

  const getGoalOptions = () => {
    switch (applicationType) {
      case 'clinical':
        return [
          'Improve patient outcomes',
          'Increase practice revenue',
          'Enhance patient engagement',
          'Streamline operations',
          'Add new service offerings',
          'Differentiate from competitors'
        ]
      case 'affiliate':
        return [
          'Generate additional income',
          'Provide value to my audience',
          'Build strategic partnerships',
          'Expand service offerings',
          'Access exclusive products',
          'Professional development'
        ]
      case 'wholesale':
        return [
          'Expand product catalog',
          'Increase profit margins',
          'Access innovative products',
          'Serve new market segments',
          'Build vendor relationships',
          'Competitive advantage'
        ]
      default:
        return ['Other']
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business Information</h3>
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type *</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => handleInputChange('businessType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your business type" />
                </SelectTrigger>
                <SelectContent>
                  {getBusinessTypeOptions().map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yearsInBusiness">Years in Business *</Label>
                <Select
                  value={formData.yearsInBusiness}
                  onValueChange={(value) => handleInputChange('yearsInBusiness', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select years in business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">Less than 1 year</SelectItem>
                    <SelectItem value="2-5">2-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-20">11-20 years</SelectItem>
                    <SelectItem value="20+">More than 20 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currentPatients">
                  {applicationType === 'clinical' ? 'Current Patients' : 'Current Clients'}
                </Label>
                <Input
                  id="currentPatients"
                  value={formData.currentPatients}
                  onChange={(e) => handleInputChange('currentPatients', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRevenue">Monthly Revenue Range</Label>
                <Select
                  value={formData.monthlyRevenue}
                  onValueChange={(value) => handleInputChange('monthlyRevenue', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-10k">Under $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                    <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
                    <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
                    <SelectItem value="over-500k">Over $500,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Requirements & Goals</h3>
            <div>
              <Label>Primary Goals (Select all that apply) *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {getGoalOptions().map((goal) => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      id={goal}
                      checked={formData.primaryGoals.includes(goal)}
                      onCheckedChange={() => handleGoalToggle(goal)}
                    />
                    <Label htmlFor={goal} className="text-sm">
                      {goal}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="currentChallenges">Current Challenges *</Label>
              <Textarea
                id="currentChallenges"
                value={formData.currentChallenges}
                onChange={(e) => handleInputChange('currentChallenges', e.target.value)}
                placeholder="Describe your current challenges and pain points..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
              <Label htmlFor="timeline">Implementation Timeline *</Label>
                <Select
                  value={formData.timeline}
                  onValueChange={(value) => handleInputChange('timeline', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (Within 1 month)</SelectItem>
                    <SelectItem value="1-3months">Short-term (1-3 months)</SelectItem>
                    <SelectItem value="3-6months">Medium-term (3-6 months)</SelectItem>
                    <SelectItem value="6months+">Long-term (6+ months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Select
                  value={formData.budget}
                  onValueChange={(value) => handleInputChange('budget', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-5k">Under $5,000</SelectItem>
                    <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="over-50k">Over $50,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="additionalInfo">Additional Information</Label>
              <Textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                placeholder="Any additional information you'd like to share..."
                rows={3}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Submit</h3>
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <strong>Personal Info:</strong> {formData.firstName} {formData.lastName} ({formData.email})
              </div>
              <div>
                <strong>Company:</strong> {formData.companyName} - {formData.businessType}
              </div>
              <div>
                <strong>Goals:</strong> {formData.primaryGoals.join(', ') || 'None selected'}
              </div>
              <div>
                <strong>Timeline:</strong> {formData.timeline || 'Not specified'}
              </div>
              <div>
                <strong>Budget:</strong> {formData.budget || 'Not specified'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the Terms of Service and Privacy Policy *
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => handleInputChange('marketingConsent', checked)}
                />
                <Label htmlFor="marketing" className="text-sm">
                  I consent to receive marketing communications
                </Label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hume Connect
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {applicationType === 'clinical' && 'Clinical Application'}
              {applicationType === 'affiliate' && 'Affiliate Application'}
              {applicationType === 'wholesale' && 'Wholesale Application'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Complete your application to get started with Hume Connect
            </p>
          </div>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Step {currentStep} of 4</CardTitle>
                <div className="text-sm text-slate-500">
                  {Math.round((currentStep / 4) * 100)}% Complete
                </div>
              </div>
              <Progress value={(currentStep / 4) * 100} className="mt-2" />
            </CardHeader>
            <CardContent>
              {renderStepContent()}

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
