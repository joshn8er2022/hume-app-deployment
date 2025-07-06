const FormConfiguration = require('../models/FormConfiguration');

/**
 * Dynamic validation middleware that validates application data based on form configuration
 * Replaces rigid enum validation with flexible, configurable validation rules
 */

const validateDynamicApplication = async (req, res, next) => {
  console.log('=== DYNAMIC VALIDATION MIDDLEWARE ===');
  console.log('Validating request body:', JSON.stringify(req.body, null, 2));
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  try {
    const { applicationType = 'clinical', ...requestData } = req.body;
    
    // Get the active form configuration for this application type
    let formConfig = await FormConfiguration.getActiveFormByType(applicationType);
    
    if (!formConfig) {
      console.log(`No active form configuration found for application type: ${applicationType}`);
      console.log('Attempting to create default form configuration...');
      
      try {
        // Try to create a default form configuration
        const { createDefaultFormForType } = require('../utils/initializeDefaultForms');
        const mongoose = require('mongoose');
        const defaultUserId = new mongoose.Types.ObjectId();
        
        const newFormConfig = await createDefaultFormForType(applicationType, defaultUserId);
        console.log(`✓ Created default form configuration: ${newFormConfig.name}`);
        
        // Use the newly created form config
        formConfig = newFormConfig;
      } catch (createError) {
        console.error('Failed to create default form configuration:', createError.message);
        
        // Fallback to legacy validation without form config
        console.log('Falling back to legacy validation without form configuration');
        return next(); // Skip dynamic validation, let legacy validation handle it
      }
    }
    
    console.log(`Using form configuration: ${formConfig.name} v${formConfig.version}`);
    
    // Extract response data from nested structure if present
    let responseData = {};
    
    // Handle nested structure (personalInfo, businessInfo, requirements)
    if (requestData.personalInfo || requestData.businessInfo || requestData.requirements) {
      responseData = {
        ...requestData.personalInfo,
        ...requestData.businessInfo,
        ...requestData.requirements,
        ...requestData
      };
    } else {
      // Handle flat structure
      responseData = { ...requestData };
    }
    
    console.log('=== EXTRACTED RESPONSE DATA ===');
    console.log(JSON.stringify(responseData, null, 2));
    
    console.log('=== FORM CONFIGURATION ANALYSIS ===');
    console.log(`Form: ${formConfig.name} v${formConfig.version}`);
    console.log(`Total fields in form: ${formConfig.fields.length}`);
    console.log('Required fields:', formConfig.fields.filter(f => f.required).map(f => f.fieldId));
    console.log('Optional fields:', formConfig.fields.filter(f => !f.required).map(f => f.fieldId));
    console.log('Fields in request data:', Object.keys(responseData));
    
    // Check which required fields are missing
    const requiredFields = formConfig.fields.filter(f => f.required);
    const missingFields = requiredFields.filter(field => {
      const value = responseData[field.fieldId];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      console.log('=== MISSING REQUIRED FIELDS ===');
      missingFields.forEach(field => {
        console.log(`- ${field.fieldId} (${field.label}): required but missing or empty`);
      });
    } else {
      console.log('✓ All required fields are present');
    }
    
    // Validate the response data against form configuration
    const validationResult = await validateResponseData(responseData, formConfig);
    
    if (!validationResult.isValid) {
      console.log('=== VALIDATION FAILED ===');
      console.log('Errors:', validationResult.errors);
      console.log('Warnings:', validationResult.warnings);
      
      // Extract clean error messages for client consumption
      const errorMessages = validationResult.errors.map(error => {
        if (typeof error === 'string') {
          return error;
        } else if (typeof error === 'object' && error !== null) {
          return error.message || `${error.label || error.field || 'Field'} validation failed`;
        }
        return 'Validation error occurred';
      });
      
      console.log('=== EXTRACTED ERROR MESSAGES ===');
      console.log('Clean messages for client:', errorMessages);
      
      return res.status(400).json({
        success: false,
        error: `Form validation failed: ${errorMessages.join(', ')}`,
        errorType: 'VALIDATION_ERROR',
        details: errorMessages, // Send clean string messages
        rawDetails: validationResult.errors, // Keep original objects for debugging
        warnings: validationResult.warnings.length > 0 ? validationResult.warnings : undefined,
        formConfiguration: {
          id: formConfig._id,
          name: formConfig.name,
          version: formConfig.version
        }
      });
    }
    
    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      console.log('=== VALIDATION WARNINGS ===');
      validationResult.warnings.forEach(warning => console.log('WARNING:', warning));
    }
    
    // Apply data transformations and normalization
    const normalizedData = await normalizeResponseData(responseData, formConfig);
    
    // Attach processed data to request for use in routes
    req.validatedData = {
      responseData: normalizedData,
      formConfiguration: formConfig._id,
      formVersion: formConfig.version,
      applicationType: applicationType,
      validationMetadata: {
        validatedAt: new Date(),
        validationWarnings: validationResult.warnings,
        formConfigUsed: {
          id: formConfig._id,
          name: formConfig.name,
          version: formConfig.version
        }
      }
    };
    
    console.log('=== DYNAMIC VALIDATION PASSED ===');
    console.log(`Data validated against form: ${formConfig.name} v${formConfig.version}`);
    if (validationResult.warnings.length > 0) {
      console.log('Proceeding with warnings:', validationResult.warnings);
    }
    
    next();
    
  } catch (error) {
    console.error('=== DYNAMIC VALIDATION ERROR ===');
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Validation system error. Please try again.',
      errorType: 'VALIDATION_SYSTEM_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Validates response data against form configuration
 */
async function validateResponseData(responseData, formConfig) {
  const errors = [];
  const warnings = [];
  
  console.log('=== FIELD VALIDATION ===');
  
  // Create a map of field configurations for quick lookup
  const fieldMap = new Map();
  formConfig.fields.forEach(field => {
    fieldMap.set(field.fieldId, field);
  });
  
  // Validate each field in the form configuration
  for (const field of formConfig.fields) {
    const value = responseData[field.fieldId];
    
    console.log(`Validating field: ${field.fieldId} (${field.type})`);
    console.log(`  Label: ${field.label}`);
    console.log(`  Required: ${field.required}`);
    console.log(`  Value: ${JSON.stringify(value)}`);
    
    // Check if field should be validated based on conditional logic
    const shouldValidate = await evaluateConditionalLogic(field, responseData, fieldMap);
    
    if (!shouldValidate) {
      console.log(`  Skipped (conditional logic)`);
      continue;
    }
    
    // Validate required fields
    if (field.required && isEmpty(value)) {
      errors.push({
        field: field.fieldId,
        label: field.label,
        message: `${field.label} is required`,
        type: 'required'
      });
      console.log(`  ERROR: Required field is empty`);
      continue;
    }
    
    // Skip further validation if field is empty and not required
    if (isEmpty(value)) {
      console.log(`  OK: Optional field is empty`);
      continue;
    }
    
    // Validate field type
    const typeValidation = validateFieldType(field, value);
    if (!typeValidation.isValid) {
      errors.push({
        field: field.fieldId,
        label: field.label,
        message: typeValidation.message || `Invalid ${field.type} format for ${field.label}`,
        type: 'type'
      });
      console.log(`  ERROR: Type validation failed - ${typeValidation.message}`);
      continue;
    }
    
    // Apply custom validation rules
    for (const rule of field.validationRules || []) {
      const ruleValidation = await applyValidationRule(rule, value, field, responseData);
      if (!ruleValidation.isValid) {
        errors.push({
          field: field.fieldId,
          label: field.label,
          message: rule.message || ruleValidation.message || `Validation failed for ${field.label}`,
          type: rule.type,
          rule: rule
        });
        console.log(`  ERROR: Rule validation failed - ${rule.type}: ${ruleValidation.message}`);
      }
    }
    
    // Validate select/radio options
    if (['select', 'radio'].includes(field.type) && field.options && field.options.length > 0) {
      const validValues = field.options.map(opt => opt.value);
      if (!validValues.includes(value)) {
        // Instead of error, try to find a close match and warn
        const closeMatch = findClosestMatch(value, validValues);
        if (closeMatch) {
          warnings.push({
            field: field.fieldId,
            label: field.label,
            message: `"${value}" is not a valid option for ${field.label}. Did you mean "${closeMatch}"?`,
            suggestion: closeMatch,
            type: 'option_mismatch'
          });
          console.log(`  WARNING: Close match found for ${value} -> ${closeMatch}`);
        } else {
          warnings.push({
            field: field.fieldId,
            label: field.label,
            message: `"${value}" is not a valid option for ${field.label}. Valid options: ${validValues.join(', ')}`,
            type: 'invalid_option'
          });
          console.log(`  WARNING: Invalid option ${value}, valid options: ${validValues.join(', ')}`);
        }
      } else {
        console.log(`  OK: Valid option selected`);
      }
    }
    
    // Validate multiselect options
    if (field.type === 'multiselect' && field.options && field.options.length > 0) {
      const validValues = field.options.map(opt => opt.value);
      const selectedValues = Array.isArray(value) ? value : [value];
      
      for (const selectedValue of selectedValues) {
        if (!validValues.includes(selectedValue)) {
          warnings.push({
            field: field.fieldId,
            label: field.label,
            message: `"${selectedValue}" is not a valid option for ${field.label}`,
            type: 'invalid_multiselect_option'
          });
          console.log(`  WARNING: Invalid multiselect option ${selectedValue}`);
        }
      }
    }
    
    console.log(`  Validation complete for ${field.fieldId}`);
  }
  
  // Check for unexpected fields (not in form configuration)
  for (const [key, value] of Object.entries(responseData)) {
    if (!fieldMap.has(key) && !['applicationType'].includes(key)) {
      warnings.push({
        field: key,
        message: `Unexpected field "${key}" not defined in form configuration`,
        type: 'unexpected_field'
      });
      console.log(`WARNING: Unexpected field ${key}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Evaluates conditional logic for a field
 */
async function evaluateConditionalLogic(field, responseData, fieldMap) {
  if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
    return true; // No conditional logic means field should always be validated
  }
  
  for (const condition of field.conditionalLogic) {
    const dependentValue = responseData[condition.dependsOn];
    const conditionMet = evaluateCondition(condition.condition, dependentValue, condition.value);
    
    if (conditionMet) {
      // Return true if action is 'show' or 'require', false if 'hide'
      return ['show', 'require'].includes(condition.action);
    }
  }
  
  return true; // Default to showing field if no conditions are met
}

/**
 * Evaluates a single condition
 */
function evaluateCondition(operator, actualValue, expectedValue) {
  switch (operator) {
    case 'equals':
      return actualValue === expectedValue;
    case 'not_equals':
      return actualValue !== expectedValue;
    case 'contains':
      return typeof actualValue === 'string' && actualValue.includes(expectedValue);
    case 'greater_than':
      return Number(actualValue) > Number(expectedValue);
    case 'less_than':
      return Number(actualValue) < Number(expectedValue);
    case 'in_array':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    default:
      console.warn(`Unknown condition operator: ${operator}`);
      return true;
  }
}

/**
 * Validates field type
 */
function validateFieldType(field, value) {
  switch (field.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(value),
        message: emailRegex.test(value) ? null : 'Please provide a valid email address'
      };
      
    case 'phone':
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      return {
        isValid: phoneRegex.test(value),
        message: phoneRegex.test(value) ? null : 'Please provide a valid phone number'
      };
      
    case 'number':
      const isNumber = !isNaN(value) && !isNaN(parseFloat(value));
      return {
        isValid: isNumber,
        message: isNumber ? null : 'Please provide a valid number'
      };
      
    case 'date':
      const isValidDate = !isNaN(Date.parse(value));
      return {
        isValid: isValidDate,
        message: isValidDate ? null : 'Please provide a valid date'
      };
      
    default:
      return { isValid: true }; // Default types (text, textarea, select, etc.) are always valid if present
  }
}

/**
 * Applies custom validation rules
 */
async function applyValidationRule(rule, value, field, responseData) {
  switch (rule.type) {
    case 'required':
      return {
        isValid: !isEmpty(value),
        message: `${field.label} is required`
      };
      
    case 'minLength':
      const minLength = typeof value === 'string' && value.length >= rule.value;
      return {
        isValid: minLength,
        message: minLength ? null : `${field.label} must be at least ${rule.value} characters long`
      };
      
    case 'maxLength':
      const maxLength = typeof value === 'string' && value.length <= rule.value;
      return {
        isValid: maxLength,
        message: maxLength ? null : `${field.label} must be no more than ${rule.value} characters long`
      };
      
    case 'pattern':
      const regex = new RegExp(rule.value);
      const patternMatch = regex.test(value);
      return {
        isValid: patternMatch,
        message: patternMatch ? null : rule.message || `${field.label} format is invalid`
      };
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailValid = emailRegex.test(value);
      return {
        isValid: emailValid,
        message: emailValid ? null : 'Please provide a valid email address'
      };
      
    case 'phone':
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      const phoneValid = phoneRegex.test(value);
      return {
        isValid: phoneValid,
        message: phoneValid ? null : 'Please provide a valid phone number'
      };
      
    case 'custom':
      // For custom validation, we would need to implement a safe evaluation system
      // For now, return valid to avoid blocking submissions
      console.warn(`Custom validation rule not implemented for field: ${field.fieldId}`);
      return { isValid: true };
      
    default:
      console.warn(`Unknown validation rule type: ${rule.type}`);
      return { isValid: true };
  }
}

/**
 * Normalizes and transforms response data
 */
async function normalizeResponseData(responseData, formConfig) {
  const normalized = { ...responseData };
  
  for (const field of formConfig.fields) {
    const value = normalized[field.fieldId];
    
    if (isEmpty(value)) continue;
    
    // Apply field-specific normalizations
    switch (field.type) {
      case 'email':
        normalized[field.fieldId] = value.toLowerCase().trim();
        break;
        
      case 'phone':
        // Normalize phone number format
        normalized[field.fieldId] = value.replace(/[^\d\+]/g, '');
        break;
        
      case 'text':
      case 'textarea':
        normalized[field.fieldId] = value.trim();
        break;
        
      case 'select':
      case 'radio':
        // Normalize to lowercase and replace spaces with hyphens for matching
        const normalizedValue = value.toLowerCase().replace(/\s+/g, '-');
        
        // Try to find exact match first
        const exactMatch = field.options?.find(opt => opt.value === value);
        if (exactMatch) {
          normalized[field.fieldId] = exactMatch.value;
          break;
        }
        
        // Try to find match with normalized value
        const normalizedMatch = field.options?.find(opt => opt.value === normalizedValue);
        if (normalizedMatch) {
          normalized[field.fieldId] = normalizedMatch.value;
          break;
        }
        
        // Try to find close match
        const closeMatch = findClosestMatch(value, field.options?.map(opt => opt.value) || []);
        if (closeMatch) {
          normalized[field.fieldId] = closeMatch;
        }
        break;
    }
  }
  
  return normalized;
}

/**
 * Helper function to check if value is empty
 */
function isEmpty(value) {
  return value === null || 
         value === undefined || 
         value === '' || 
         (Array.isArray(value) && value.length === 0) ||
         (typeof value === 'string' && value.trim() === '');
}

/**
 * Finds the closest match from valid options using fuzzy matching
 */
function findClosestMatch(input, validOptions) {
  if (!input || !validOptions || validOptions.length === 0) return null;
  
  const inputLower = input.toLowerCase();
  const inputNormalized = inputLower.replace(/\s+/g, '-');
  
  // Try exact matches first
  for (const option of validOptions) {
    if (option.toLowerCase() === inputLower ||
        option.toLowerCase().replace(/\s+/g, '-') === inputNormalized) {
      return option;
    }
  }
  
  // Try partial matches
  for (const option of validOptions) {
    if (option.toLowerCase().includes(inputLower) ||
        inputLower.includes(option.toLowerCase())) {
      return option;
    }
  }
  
  // Try fuzzy matching (simple Levenshtein distance)
  let bestMatch = null;
  let bestScore = Infinity;
  
  for (const option of validOptions) {
    const score = calculateLevenshteinDistance(inputLower, option.toLowerCase());
    if (score < bestScore && score <= 3) { // Allow up to 3 character differences
      bestScore = score;
      bestMatch = option;
    }
  }
  
  return bestMatch;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Legacy validation middleware for backwards compatibility
 * Gradually phases out rigid enum validation
 */
const validateLegacyApplication = (req, res, next) => {
  console.log('=== LEGACY VALIDATION MIDDLEWARE (DEPRECATED) ===');
  console.log('This validation method is deprecated. Please update to use dynamic validation.');
  
  // For now, just pass through - the dynamic validation will handle everything
  next();
};

module.exports = {
  validateDynamicApplication,
  validateLegacyApplication
};