const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const { nanoid } = require('nanoid');
const { verifyApiKey } = require('../middleware/auth');
const Url = require('../models/Url');

// API documentation
router.get('/', (req, res) => {
  res.render('api/documentation', {
    title: 'API Documentation'
  });
});

// Create a short URL
router.post('/shorten', verifyApiKey, async (req, res) => {
  const { longUrl, customCode, title, expireAfter } = req.body;
  const baseUrl = process.env.BASE_URL;
  
  // Validate URL
  if (!longUrl || !validUrl.isUri(longUrl)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid URL format'
    });
  }
  
  try {
    // Check if custom code is provided and available
    let urlCode = customCode ? customCode.trim() : nanoid(8);
    
    if (customCode) {
      // Check if custom code already exists
      const existingUrl = await Url.findOne({ urlCode });
      if (existingUrl) {
        return res.status(409).json({
          success: false,
          message: 'Custom URL code already in use'
        });
      }
      
      // Validate custom code format (alphanumeric only)
      if (!/^[a-zA-Z0-9-_]+$/.test(urlCode)) {
        return res.status(400).json({
          success: false,
          message: 'Custom URL code can only contain letters, numbers, hyphens, and underscores'
        });
      }
    }
    
    // Calculate expiration date if provided
    let expiresAt = null;
    if (expireAfter) {
      const hours = parseInt(expireAfter);
      if (!isNaN(hours) && hours > 0) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + hours);
      }
    }
    
    // Create new URL
    const shortUrl = `${baseUrl}/${urlCode}`;
    
    const newUrl = new Url({
      urlCode,
      longUrl,
      shortUrl,
      title: title || '',
      user: req.user._id,
      expiresAt
    });
    
    await newUrl.save();
    
    return res.status(201).json({
      success: true,
      shortUrl,
      urlCode,
      longUrl,
      expiresAt
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get URL info
router.get('/info/:code', verifyApiKey, async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Check if user has access to this URL
    if (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this URL'
      });
    }
    
    return res.json({
      success: true,
      urlCode: url.urlCode,
      longUrl: url.longUrl,
      shortUrl: url.shortUrl,
      title: url.title,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      isActive: url.isActive,
      clicks: url.clicks
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's URLs
router.get('/urls', verifyApiKey, async (req, res) => {
  try {
    const urls = await Url.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('urlCode longUrl shortUrl title createdAt expiresAt isActive clicks');
    
    return res.json({
      success: true,
      count: urls.length,
      urls
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get URL analytics
router.get('/analytics/:code', verifyApiKey, async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Check if user has access to this URL
    if (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this URL'
      });
    }
    
    const stats = url.getClickStats();
    
    return res.json({
      success: true,
      urlCode: url.urlCode,
      shortUrl: url.shortUrl,
      analytics: stats
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update URL
router.put('/urls/:code', verifyApiKey, async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Check if user has access to this URL
    if (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this URL'
      });
    }
    
    const { longUrl, title, isActive } = req.body;
    
    // Validate URL if provided
    if (longUrl) {
      if (!validUrl.isUri(longUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
      }
      url.longUrl = longUrl;
    }
    
    // Update fields if provided
    if (title !== undefined) url.title = title;
    if (isActive !== undefined) url.isActive = isActive;
    
    await url.save();
    
    return res.json({
      success: true,
      message: 'URL updated successfully',
      url: {
        urlCode: url.urlCode,
        longUrl: url.longUrl,
        shortUrl: url.shortUrl,
        title: url.title,
        isActive: url.isActive
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete URL
router.delete('/urls/:code', verifyApiKey, async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    // Check if user has access to this URL
    if (url.user && url.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this URL'
      });
    }
    
    await Url.findByIdAndDelete(url._id);
    
    return res.json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;