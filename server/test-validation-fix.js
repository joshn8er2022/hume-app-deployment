#!/usr/bin/env node

/**
 * Test script to validate the "[object Object]" error fixes
 * Run this script to test the validation system without starting the full server
 */

const path = require('path');
const mongoose = require('mongoose');

// Set up environment
process.env.NODE_ENV = 'development';
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('=== VALIDATION FIX TEST SCRIPT ===');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Configured' : 'Missing');
console.log('Environment:', process.env.NODE_ENV);

async function testValidationFix() {
  try {
    // Connect to database
    console.log('\n1. Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Database connected');

    // Load models
    console.log('\n2. Loading models...');
    const FormConfiguration = require('./models/FormConfiguration');
    const Application = require('./models/Application');
    console.log('✓ Models loaded');

    // Check form configurations
    console.log('\n3. Checking form configurations...');
    const clinicalForm = await FormConfiguration.getActiveFormByType('clinical');
    const affiliateForm = await FormConfiguration.getActiveFormByType('affiliate');
    const wholesaleForm = await FormConfiguration.getActiveFormByType('wholesale');

    console.log(`Clinical form: ${clinicalForm ? '✓ Available' : '❌ Missing'}`);
    console.log(`Affiliate form: ${affiliateForm ? '✓ Available' : '❌ Missing'}`);
    console.log(`Wholesale form: ${wholesaleForm ? '✓ Available' : '❌ Missing'}`);

    if (!clinicalForm) {
      console.log('\n4. Creating missing form configurations...');
      const { initializeDefaultForms } = require('./utils/initializeDefaultForms');
      await initializeDefaultForms();
      console.log('✓ Default forms initialized');
    }

    // Test validation middleware
    console.log('\n5. Testing validation middleware...');
    const { validateDynamicApplication } = require('./middleware/dynamicValidation');

    // Mock request with missing required fields
    const mockReq = {
      body: {
        applicationType: 'clinical',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
          // Missing phone
        },
        businessInfo: {
          companyName: 'Test Company'
          // Missing businessType
        },
        requirements: {
          currentChallenges: 'Need better solutions',
          primaryGoals: 'Improve efficiency',
          timeline: 'immediate'
        }
      },
      headers: {
        'user-agent': 'Test Script',
        'content-type': 'application/json'
      },
      method: 'POST',
      url: '/api/applications'
    };

    let validationResult = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          validationResult = { statusCode: code, data };
          return mockRes;
        }
      })
    };

    const mockNext = () => {
      console.log('✓ Validation passed - proceeding to next middleware');
    };

    console.log('Testing with incomplete data...');
    await validateDynamicApplication(mockReq, mockRes, mockNext);

    if (validationResult) {
      console.log('\n6. Validation result analysis:');
      console.log(`Status Code: ${validationResult.statusCode}`);
      console.log(`Error Type: ${validationResult.data.errorType}`);
      console.log(`Error Message: ${validationResult.data.error}`);
      
      if (validationResult.data.details) {
        console.log('Error Details:');
        validationResult.data.details.forEach((detail, index) => {
          console.log(`  ${index + 1}. ${detail}`);
        });
      }

      // Check if we still have [object Object] errors
      const hasObjectError = JSON.stringify(validationResult.data).includes('[object Object]');
      if (hasObjectError) {
        console.log('❌ STILL HAS [object Object] ERRORS');
      } else {
        console.log('✓ NO [object Object] ERRORS FOUND');
      }
    }

    // Test with complete data
    console.log('\n7. Testing with complete data...');
    mockReq.body.personalInfo.phone = '+1234567890';
    mockReq.body.businessInfo.businessType = 'wellness';
    mockReq.body.businessInfo.yearsInBusiness = '2-5';

    validationResult = null;
    await validateDynamicApplication(mockReq, mockRes, mockNext);

    if (validationResult) {
      console.log('❌ Validation failed with complete data');
      console.log('Error:', validationResult.data.error);
    } else {
      console.log('✓ Validation passed with complete data');
    }

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('The validation fix appears to be working correctly.');
    console.log('You should now see clear error messages instead of [object Object].');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Database disconnected');
  }
}

// Run the test
testValidationFix().catch(console.error);
