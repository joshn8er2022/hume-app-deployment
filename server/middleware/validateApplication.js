const validateApplicationData = (req, res, next) => {
  console.log('=== APPLICATION VALIDATION MIDDLEWARE ===');
  console.log('Validating request body:', JSON.stringify(req.body, null, 2));
  
  const { personalInfo = {}, businessInfo = {}, requirements = {}, applicationType } = req.body;
  
  const errors = [];
  const warnings = [];
  
  // Validate application type
  const validApplicationTypes = ['clinical', 'affiliate', 'wholesale'];
  if (!applicationType || !validApplicationTypes.includes(applicationType)) {
    warnings.push(`Invalid application type: ${applicationType}. Defaulting to 'clinical'.`);
  }
  
  // Validate personal info
  if (!personalInfo.firstName || personalInfo.firstName.trim().length < 1) {
    errors.push('Personal info: First name is required');
  }
  if (!personalInfo.lastName || personalInfo.lastName.trim().length < 1) {
    errors.push('Personal info: Last name is required');
  }
  if (!personalInfo.email || personalInfo.email.trim().length < 1) {
    errors.push('Personal info: Email is required');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalInfo.email)) {
      errors.push('Personal info: Invalid email format');
    }
  }
  if (!personalInfo.phone || personalInfo.phone.trim().length < 1) {
    errors.push('Personal info: Phone is required');
  }
  
  // Validate business info
  if (!businessInfo.companyName || businessInfo.companyName.trim().length < 1) {
    errors.push('Business info: Company name is required');
  }
  if (!businessInfo.businessType || businessInfo.businessType.trim().length < 1) {
    errors.push('Business info: Business type is required');
  } else {
    // Validate business type enum
    const validBusinessTypes = ['diabetic', 'wellness', 'longevity', 'glp1', 'telehealth', 'affiliate', 'wholesale', 'health-coach', 'other'];
    if (!validBusinessTypes.includes(businessInfo.businessType)) {
      warnings.push(`Invalid business type: ${businessInfo.businessType}. Please use one of: ${validBusinessTypes.join(', ')}`);
    }
  }
  
  // Validate requirements
  if (!requirements.currentChallenges || requirements.currentChallenges.trim().length < 1) {
    errors.push('Requirements: Current challenges is required');
  }
  if (!requirements.timeline || requirements.timeline.trim().length < 1) {
    errors.push('Requirements: Timeline is required');
  } else {
    // Validate timeline enum
    const validTimelines = ['immediate', '1-3months', '3-6months', '6months+', 'exploring'];
    if (!validTimelines.includes(requirements.timeline)) {
      warnings.push(`Invalid timeline: ${requirements.timeline}. Please use one of: ${validTimelines.join(', ')}`);
    }
  }
  
  // Validate primaryGoals
  if (!requirements.primaryGoals) {
    warnings.push('Requirements: Primary goals not provided');
  } else if (Array.isArray(requirements.primaryGoals) && requirements.primaryGoals.length === 0) {
    warnings.push('Requirements: No primary goals specified');
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.log('=== VALIDATION WARNINGS ===');
    warnings.forEach(warning => console.log('WARNING:', warning));
  }
  
  // Return errors if any
  if (errors.length > 0) {
    console.log('=== VALIDATION ERRORS ===');
    errors.forEach(error => console.log('ERROR:', error));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errorType: 'VALIDATION_ERROR',
      details: errors,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  }
  
  console.log('=== VALIDATION PASSED ===');
  if (warnings.length > 0) {
    console.log('Proceeding with warnings:', warnings);
  }
  
  next();
};

const validateApplicationUpdate = (req, res, next) => {
  console.log('=== APPLICATION UPDATE VALIDATION MIDDLEWARE ===');
  
  const { applicationId } = req.params;
  const updateData = req.body;
  
  // Validate applicationId format (MongoDB ObjectId)
  if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid application ID format',
      errorType: 'VALIDATION_ERROR'
    });
  }
  
  // Validate status if provided
  if (updateData.status) {
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'scheduled'];
    if (!validStatuses.includes(updateData.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        errorType: 'VALIDATION_ERROR'
      });
    }
  }
  
  console.log('=== UPDATE VALIDATION PASSED ===');
  next();
};

module.exports = { 
  validateApplicationData, 
  validateApplicationUpdate 
};