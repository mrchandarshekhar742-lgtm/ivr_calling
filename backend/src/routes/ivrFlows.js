const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { IVRFlow, IVRNode, AudioFile } = require('../models');

const router = express.Router();

// @route   GET /api/ivr-flows
// @desc    Get all IVR flows for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const flows = await IVRFlow.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: IVRNode,
          as: 'nodes',
          include: [{ model: AudioFile, as: 'audioFile' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: flows
    });
  } catch (error) {
    logger.error('Get IVR flows error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ivr-flows/:id
// @desc    Get single IVR flow
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const flow = await IVRFlow.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: IVRNode,
          as: 'nodes',
          include: [{ model: AudioFile, as: 'audioFile' }]
        }
      ]
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    res.json({
      success: true,
      data: flow
    });
  } catch (error) {
    logger.error('Get IVR flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/ivr-flows
// @desc    Create new IVR flow
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('flowConfig').optional().isObject(),
  body('defaultLanguage').optional().isIn(['en', 'hi', 'es', 'fr']),
  body('maxRetries').optional().isInt({ min: 1, max: 10 }),
  body('timeout').optional().isInt({ min: 5, max: 60 })
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

    const { name, description, flowConfig, defaultLanguage, maxRetries, timeout } = req.body;

    const flow = await IVRFlow.create({
      userId: req.user.id,
      name,
      description,
      flowConfig: flowConfig || {},
      defaultLanguage: defaultLanguage || 'en',
      maxRetries: maxRetries || 3,
      timeout: timeout || 10
    });

    logger.info(`IVR flow created: ${name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'IVR flow created successfully',
      data: flow
    });
  } catch (error) {
    logger.error('Create IVR flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/ivr-flows/:id
// @desc    Update IVR flow
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().trim(),
  body('flowConfig').optional().isObject(),
  body('isActive').optional().isBoolean(),
  body('defaultLanguage').optional().isIn(['en', 'hi', 'es', 'fr']),
  body('maxRetries').optional().isInt({ min: 1, max: 10 }),
  body('timeout').optional().isInt({ min: 5, max: 60 })
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

    const flow = await IVRFlow.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    const { name, description, flowConfig, isActive, defaultLanguage, maxRetries, timeout } = req.body;

    if (name) flow.name = name;
    if (description !== undefined) flow.description = description;
    if (flowConfig) flow.flowConfig = flowConfig;
    if (isActive !== undefined) flow.isActive = isActive;
    if (defaultLanguage) flow.defaultLanguage = defaultLanguage;
    if (maxRetries) flow.maxRetries = maxRetries;
    if (timeout) flow.timeout = timeout;

    await flow.save();

    logger.info(`IVR flow updated: ${flow.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'IVR flow updated successfully',
      data: flow
    });
  } catch (error) {
    logger.error('Update IVR flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/ivr-flows/:id
// @desc    Delete IVR flow
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const flow = await IVRFlow.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    // Delete associated nodes
    await IVRNode.destroy({ where: { flowId: flow.id } });

    await flow.destroy();

    logger.info(`IVR flow deleted: ${flow.name} by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'IVR flow deleted successfully'
    });
  } catch (error) {
    logger.error('Delete IVR flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/ivr-flows/:id/nodes
// @desc    Add node to IVR flow
// @access  Private
router.post('/:id/nodes', auth, [
  body('nodeKey').trim().isLength({ min: 1, max: 50 }),
  body('nodeName').trim().isLength({ min: 1, max: 255 }),
  body('audioFileId').optional().isInt(),
  body('promptText').optional().trim(),
  body('nodeType').optional().isIn(['menu', 'message', 'input', 'transfer', 'end']),
  body('timeout').optional().isInt({ min: 5, max: 60 }),
  body('retryCount').optional().isInt({ min: 1, max: 10 }),
  body('actions').optional().isObject()
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

    const flow = await IVRFlow.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    const { nodeKey, nodeName, audioFileId, promptText, nodeType, timeout, retryCount, actions, parentNodeId } = req.body;

    // Check if node key already exists in this flow
    const existingNode = await IVRNode.findOne({
      where: { flowId: flow.id, nodeKey }
    });

    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: 'Node key already exists in this flow'
      });
    }

    const node = await IVRNode.create({
      flowId: flow.id,
      nodeKey,
      nodeName,
      audioFileId,
      promptText,
      nodeType: nodeType || 'menu',
      timeout: timeout || 10,
      retryCount: retryCount || 3,
      actions: actions || {},
      parentNodeId
    });

    logger.info(`IVR node added: ${nodeKey} to flow ${flow.name}`);

    res.json({
      success: true,
      message: 'IVR node added successfully',
      data: node
    });
  } catch (error) {
    logger.error('Add IVR node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/ivr-flows/:flowId/nodes/:nodeId
// @desc    Update IVR node
// @access  Private
router.put('/:flowId/nodes/:nodeId', auth, async (req, res) => {
  try {
    const flow = await IVRFlow.findOne({
      where: { id: req.params.flowId, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    const node = await IVRNode.findOne({
      where: { id: req.params.nodeId, flowId: flow.id }
    });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'IVR node not found'
      });
    }

    const { nodeName, audioFileId, promptText, nodeType, timeout, retryCount, actions } = req.body;

    if (nodeName) node.nodeName = nodeName;
    if (audioFileId !== undefined) node.audioFileId = audioFileId;
    if (promptText !== undefined) node.promptText = promptText;
    if (nodeType) node.nodeType = nodeType;
    if (timeout) node.timeout = timeout;
    if (retryCount) node.retryCount = retryCount;
    if (actions) node.actions = actions;

    await node.save();

    logger.info(`IVR node updated: ${node.nodeKey} in flow ${flow.name}`);

    res.json({
      success: true,
      message: 'IVR node updated successfully',
      data: node
    });
  } catch (error) {
    logger.error('Update IVR node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/ivr-flows/:flowId/nodes/:nodeId
// @desc    Delete IVR node
// @access  Private
router.delete('/:flowId/nodes/:nodeId', auth, async (req, res) => {
  try {
    const flow = await IVRFlow.findOne({
      where: { id: req.params.flowId, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    const node = await IVRNode.findOne({
      where: { id: req.params.nodeId, flowId: flow.id }
    });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: 'IVR node not found'
      });
    }

    await node.destroy();

    logger.info(`IVR node deleted: ${node.nodeKey} from flow ${flow.name}`);

    res.json({
      success: true,
      message: 'IVR node deleted successfully'
    });
  } catch (error) {
    logger.error('Delete IVR node error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/ivr-flows/:id/execute/:nodeKey
// @desc    Get next node based on DTMF input (for device execution)
// @access  Private
router.get('/:id/execute/:nodeKey', auth, async (req, res) => {
  try {
    const { dtmf } = req.query;

    const flow = await IVRFlow.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!flow) {
      return res.status(404).json({
        success: false,
        message: 'IVR flow not found'
      });
    }

    const currentNode = await IVRNode.findOne({
      where: { flowId: flow.id, nodeKey: req.params.nodeKey },
      include: [{ model: AudioFile, as: 'audioFile' }]
    });

    if (!currentNode) {
      return res.status(404).json({
        success: false,
        message: 'IVR node not found'
      });
    }

    // If DTMF provided, find next node
    let nextNode = null;
    if (dtmf && currentNode.actions && currentNode.actions[dtmf]) {
      const action = currentNode.actions[dtmf];
      
      if (action.type === 'goto' && action.target) {
        nextNode = await IVRNode.findOne({
          where: { flowId: flow.id, nodeKey: action.target },
          include: [{ model: AudioFile, as: 'audioFile' }]
        });
      }
    }

    res.json({
      success: true,
      data: {
        currentNode,
        nextNode,
        flowComplete: !nextNode && dtmf
      }
    });
  } catch (error) {
    logger.error('Execute IVR flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
