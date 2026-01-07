const express = require('express');
const { body, validationResult } = require('express-validator');
const { Contact, Campaign } = require('../models');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get all contacts for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, campaignId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { createdBy: req.user.id };
    if (status) whereClause.status = status;
    if (campaignId) whereClause.campaignId = campaignId;

    const contacts = await Contact.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        contacts: contacts.rows,
        pagination: {
          total: contacts.count,
          page: parseInt(page),
          pages: Math.ceil(contacts.count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/contacts
// @desc    Create new contact
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('phone').isMobilePhone(),
  body('email').optional().isEmail(),
  body('campaignId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { name, phone, email, campaignId, notes, customFields } = req.body;

    // Check if contact with same phone already exists
    const existingContact = await Contact.findOne({
      where: { phone, createdBy: req.user.id }
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact with this phone number already exists'
      });
    }

    // Verify campaign exists if provided
    if (campaignId) {
      const campaign = await Campaign.findOne({
        where: { id: campaignId, createdBy: req.user.id }
      });
      if (!campaign) {
        return res.status(400).json({
          success: false,
          message: 'Campaign not found'
        });
      }
    }

    const contact = await Contact.create({
      name,
      phone,
      email,
      campaignId,
      notes,
      customFields: customFields || {},
      createdBy: req.user.id
    });

    logger.info(`Contact created: ${contact.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: contact
    });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/contacts/bulk
// @desc    Bulk import contacts
// @access  Private
router.post('/bulk', auth, [
  body('contacts').isArray({ min: 1 }),
  body('contacts.*.name').trim().isLength({ min: 2, max: 100 }),
  body('contacts.*.phone').isMobilePhone(),
  body('contacts.*.email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { contacts, campaignId } = req.body;

    // Verify campaign exists if provided
    if (campaignId) {
      const campaign = await Campaign.findOne({
        where: { id: campaignId, createdBy: req.user.id }
      });
      if (!campaign) {
        return res.status(400).json({
          success: false,
          message: 'Campaign not found'
        });
      }
    }

    // Get existing phone numbers to avoid duplicates
    const existingPhones = await Contact.findAll({
      where: { createdBy: req.user.id },
      attributes: ['phone']
    });
    const phoneSet = new Set(existingPhones.map(c => c.phone));

    // Filter out duplicates
    const newContacts = contacts.filter(contact => !phoneSet.has(contact.phone));

    if (newContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All contacts already exist'
      });
    }

    // Add metadata to contacts
    const contactsToCreate = newContacts.map(contact => ({
      ...contact,
      campaignId,
      createdBy: req.user.id,
      customFields: contact.customFields || {}
    }));

    const createdContacts = await Contact.bulkCreate(contactsToCreate);

    logger.info(`Bulk contacts created: ${createdContacts.length} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${createdContacts.length} contacts created successfully`,
      data: {
        created: createdContacts.length,
        duplicates: contacts.length - newContacts.length,
        contacts: createdContacts
      }
    });
  } catch (error) {
    logger.error('Bulk create contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/contacts/bulk-text
// @desc    Bulk import contacts from text numbers
// @access  Private
router.post('/bulk-text', auth, [
  body('contacts').isArray().withMessage('Contacts must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const { contacts } = req.body;
    const createdContacts = [];
    const duplicates = [];

    for (const contactData of contacts) {
      try {
        // Check if contact already exists
        const existingContact = await Contact.findOne({
          where: {
            phone: contactData.phone,
            createdBy: req.user.id
          }
        });

        if (existingContact) {
          duplicates.push(contactData.phone);
          continue;
        }

        // Create new contact
        const contact = await Contact.create({
          ...contactData,
          createdBy: req.user.id
        });

        createdContacts.push(contact);
      } catch (error) {
        logger.error(`Error creating contact ${contactData.phone}:`, error);
      }
    }

    logger.info(`Bulk text import: ${createdContacts.length} contacts created by ${req.user.email}`);

    res.json({
      success: true,
      message: `Successfully imported ${createdContacts.length} contacts`,
      data: {
        added: createdContacts.length,
        duplicates: duplicates.length,
        total: contacts.length
      }
    });
  } catch (error) {
    logger.error('Bulk text import error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/contacts/:id
// @desc    Get single contact
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        {
          model: Campaign,
          as: 'campaign'
        }
      ]
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    logger.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/contacts/:id
// @desc    Update contact
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail(),
  body('campaignId').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }

    const contact = await Contact.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Check for phone number conflicts if phone is being updated
    if (req.body.phone && req.body.phone !== contact.phone) {
      const existingContact = await Contact.findOne({
        where: { phone: req.body.phone, createdBy: req.user.id }
      });
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: 'Contact with this phone number already exists'
        });
      }
    }

    await contact.update(req.body);

    logger.info(`Contact updated: ${contact.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: contact
    });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const contact = await Contact.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    await contact.destroy();

    logger.info(`Contact deleted: ${contact.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;