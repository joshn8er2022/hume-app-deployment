const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');
const Application = require('../models/Application');
const { validateDynamicApplication } = require('../middleware/dynamicValidation');

console.log('=== FORM CONFIGURATION ROUTES: Loading ===');

// Middleware for admin authentication (placeholder - implement based on your auth system)
const requireAdmin = (req, res, next) => {
  // TODO: Implement proper admin authentication
  // For now, we'll skip authentication in development
  if (process.env.NODE_ENV !== 'production') {
    req.user = { _id: 'admin-user-id', role: 'admin' };
    return next();
  }
  
  // In production, implement proper authentication
  res.status(401).json({
    success: false,
    error: 'Admin authentication required'
  });
};

/**
 * @route GET /api/admin/forms
 * @desc Get all form configurations with pagination and filtering
 * @access Admin
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('=== GET FORM CONFIGURATIONS ===');
    console.log('Query params:', req.query);
    
    const {
      page = 1,
      limit = 10,
      applicationType,
      isActive,
      isDefault,
      search
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (applicationType) filter.applicationType = applicationType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDefault !== undefined) filter.isDefault = isDefault === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get forms with pagination
    const [forms, totalCount] = await Promise.all([
      FormConfiguration.find(filter)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FormConfiguration.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    console.log(`Retrieved ${forms.length} form configurations (${totalCount} total)`);
    
    res.status(200).json({
      success: true,
      data: {
        forms,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('=== GET FORM CONFIGURATIONS ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve form configurations'
    });
  }
});

/**
 * @route GET /api/admin/forms/:formId
 * @desc Get specific form configuration by ID
 * @access Admin
 */
router.get('/:formId', requireAdmin, async (req, res) => {
  try {
    console.log('=== GET FORM CONFIGURATION BY ID ===');
    console.log('Form ID:', req.params.formId);
    
    const form = await FormConfiguration.findById(req.params.formId)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form configuration not found'
      });
    }
    
    // Get usage statistics
    const applicationCount = await Application.countDocuments({
      formConfiguration: form._id
    });
    
    const recentApplications = await Application.find({
      formConfiguration: form._id
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('email firstName lastName status createdAt');
    
    console.log(`Form configuration retrieved: ${form.name}`);
    
    res.status(200).json({
      success: true,
      data: {
        form,
        usage: {
          applicationCount,
          recentApplications
        }
      }
    });
    
  } catch (error) {
    console.error('=== GET FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid form configuration ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve form configuration'
    });
  }
});

/**
 * @route POST /api/admin/forms
 * @desc Create new form configuration
 * @access Admin
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    console.log('=== CREATE FORM CONFIGURATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const formData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    // Validate required fields
    if (!formData.name || !formData.applicationType) {
      return res.status(400).json({
        success: false,
        error: 'Name and application type are required'
      });
    }
    
    // Validate fields structure
    if (!formData.fields || !Array.isArray(formData.fields) || formData.fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field is required'
      });
    }
    
    // Create form configuration
    const form = new FormConfiguration(formData);
    await form.save();
    
    console.log(`Form configuration created: ${form.name} (${form._id})`);
    
    res.status(201).json({
      success: true,
      message: 'Form configuration created successfully',
      data: { form }
    });
    
  } catch (error) {
    console.error('=== CREATE FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create form configuration'
    });
  }
});

/**
 * @route PUT /api/admin/forms/:formId
 * @desc Update form configuration
 * @access Admin
 */
router.put('/:formId', requireAdmin, async (req, res) => {
  try {
    console.log('=== UPDATE FORM CONFIGURATION ===');
    console.log('Form ID:', req.params.formId);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const form = await FormConfiguration.findByIdAndUpdate(
      req.params.formId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    )
    .populate('createdBy', 'name email')
    .populate('lastModifiedBy', 'name email');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form configuration not found'
      });
    }
    
    console.log(`Form configuration updated: ${form.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Form configuration updated successfully',
      data: { form }
    });
    
  } catch (error) {
    console.error('=== UPDATE FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid form configuration ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update form configuration'
    });
  }
});

/**
 * @route DELETE /api/admin/forms/:formId
 * @desc Archive/delete form configuration
 * @access Admin
 */
router.delete('/:formId', requireAdmin, async (req, res) => {
  try {
    console.log('=== DELETE FORM CONFIGURATION ===');
    console.log('Form ID:', req.params.formId);
    
    const form = await FormConfiguration.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form configuration not found'
      });
    }
    
    // Check if form has associated applications
    const applicationCount = await Application.countDocuments({
      formConfiguration: form._id
    });
    
    if (applicationCount > 0) {
      // Archive instead of delete if there are associated applications
      form.isActive = false;
      form.archivedAt = new Date();
      await form.save();
      
      console.log(`Form configuration archived: ${form.name} (${applicationCount} applications)`);
      
      res.status(200).json({
        success: true,
        message: `Form configuration archived (${applicationCount} associated applications preserved)`,
        data: { form }
      });
    } else {
      // Delete if no associated applications
      await FormConfiguration.findByIdAndDelete(req.params.formId);
      
      console.log(`Form configuration deleted: ${form.name}`);
      
      res.status(200).json({
        success: true,
        message: 'Form configuration deleted successfully'
      });
    }
    
  } catch (error) {
    console.error('=== DELETE FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid form configuration ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete form configuration'
    });
  }
});

/**
 * @route POST /api/admin/forms/:formId/clone
 * @desc Clone form configuration
 * @access Admin
 */
router.post('/:formId/clone', requireAdmin, async (req, res) => {
  try {
    console.log('=== CLONE FORM CONFIGURATION ===');
    console.log('Source Form ID:', req.params.formId);
    
    const sourceForm = await FormConfiguration.findById(req.params.formId);
    
    if (!sourceForm) {
      return res.status(404).json({
        success: false,
        error: 'Source form configuration not found'
      });
    }
    
    // Create clone with updated metadata
    const cloneData = sourceForm.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    
    cloneData.name = req.body.name || `${sourceForm.name} (Copy)`;
    cloneData.description = req.body.description || `Clone of ${sourceForm.name}`;
    cloneData.version = '1.0.0';
    cloneData.isActive = false; // Start as inactive
    cloneData.isDefault = false; // Cannot be default
    cloneData.createdBy = req.user._id;
    cloneData.lastModifiedBy = req.user._id;
    cloneData.statistics = {
      totalViews: 0,
      totalSubmissions: 0,
      conversionRate: 0,
      averageCompletionTime: 0
    };
    
    const clonedForm = new FormConfiguration(cloneData);
    await clonedForm.save();
    
    console.log(`Form configuration cloned: ${clonedForm.name} (${clonedForm._id})`);
    
    res.status(201).json({
      success: true,
      message: 'Form configuration cloned successfully',
      data: { form: clonedForm }
    });
    
  } catch (error) {
    console.error('=== CLONE FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to clone form configuration'
    });
  }
});

/**
 * @route POST /api/admin/forms/:formId/set-default
 * @desc Set form as default for its application type
 * @access Admin
 */
router.post('/:formId/set-default', requireAdmin, async (req, res) => {
  try {
    console.log('=== SET DEFAULT FORM CONFIGURATION ===');
    console.log('Form ID:', req.params.formId);
    
    const form = await FormConfiguration.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form configuration not found'
      });
    }
    
    // Set this form as default (pre-save middleware will handle unsetting others)
    form.isDefault = true;
    form.isActive = true; // Must be active to be default
    await form.save();
    
    console.log(`Form configuration set as default: ${form.name} for ${form.applicationType}`);
    
    res.status(200).json({
      success: true,
      message: `Form configuration set as default for ${form.applicationType} applications`,
      data: { form }
    });
    
  } catch (error) {
    console.error('=== SET DEFAULT FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to set default form configuration'
    });
  }
});

/**
 * @route POST /api/admin/forms/:formId/test
 * @desc Test form configuration with sample data
 * @access Admin
 */
router.post('/:formId/test', requireAdmin, async (req, res) => {
  try {
    console.log('=== TEST FORM CONFIGURATION ===');
    console.log('Form ID:', req.params.formId);
    console.log('Test data:', JSON.stringify(req.body, null, 2));
    
    const form = await FormConfiguration.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form configuration not found'
      });
    }
    
    // Validate test data against form configuration
    const validationResult = form.validateResponse(req.body.testData || {});
    
    console.log(`Form validation test completed: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    
    res.status(200).json({
      success: true,
      data: {
        formId: form._id,
        formName: form.name,
        testResult: validationResult,
        testData: req.body.testData
      }
    });
    
  } catch (error) {
    console.error('=== TEST FORM CONFIGURATION ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to test form configuration'
    });
  }
});

/**
 * @route GET /api/admin/forms/types/:applicationType/default
 * @desc Get default form for application type
 * @access Public (used by frontend form renderer)
 */
router.get('/types/:applicationType/default', async (req, res) => {
  try {
    console.log('=== GET DEFAULT FORM FOR APPLICATION TYPE ===');
    console.log('Application Type:', req.params.applicationType);
    
    const form = await FormConfiguration.getActiveFormByType(req.params.applicationType);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: `No active form configuration found for application type: ${req.params.applicationType}`
      });
    }
    
    console.log(`Default form retrieved: ${form.name} v${form.version}`);
    
    res.status(200).json({
      success: true,
      data: { form }
    });
    
  } catch (error) {
    console.error('=== GET DEFAULT FORM ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve default form configuration'
    });
  }
});

/**
 * @route GET /api/admin/forms/analytics/summary
 * @desc Get analytics summary for all forms
 * @access Admin
 */
router.get('/analytics/summary', requireAdmin, async (req, res) => {
  try {
    console.log('=== GET FORM ANALYTICS SUMMARY ===');
    
    const [
      totalForms,
      activeForms,
      totalApplications,
      formUsageStats
    ] = await Promise.all([
      FormConfiguration.countDocuments(),
      FormConfiguration.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Application.aggregate([
        {
          $group: {
            _id: '$formConfiguration',
            submissionCount: { $sum: 1 },
            avgCompleteness: { $avg: '$qualityScores.completeness' },
            lastSubmission: { $max: '$createdAt' }
          }
        },
        {
          $lookup: {
            from: 'formconfigurations',
            localField: '_id',
            foreignField: '_id',
            as: 'form'
          }
        },
        {
          $unwind: '$form'
        },
        {
          $project: {
            formName: '$form.name',
            applicationType: '$form.applicationType',
            submissionCount: 1,
            avgCompleteness: 1,
            lastSubmission: 1
          }
        },
        {
          $sort: { submissionCount: -1 }
        }
      ])
    ]);
    
    console.log(`Analytics summary generated: ${totalForms} forms, ${totalApplications} applications`);
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalForms,
          activeForms,
          totalApplications,
          averageSubmissionsPerForm: totalForms > 0 ? Math.round(totalApplications / totalForms) : 0
        },
        formUsageStats
      }
    });
    
  } catch (error) {
    console.error('=== GET FORM ANALYTICS SUMMARY ERROR ===');
    console.error('Error details:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics summary'
    });
  }
});

console.log('=== FORM CONFIGURATION ROUTES LOADED SUCCESSFULLY ===');

module.exports = router;