const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const { nanoid } = require('nanoid');
const Url = require('../models/Url');
const { ensureAuthenticated, checkUrlOwnership } = require('../middleware/auth');

// Create short URL page
router.get('/create', ensureAuthenticated, (req, res) => {
  res.render('urls/create', {
    title: 'Create Short URL'
  });
});

// Handle URL creation
router.post('/create', ensureAuthenticated, async (req, res) => {
  const { longUrl, customCode, title, expiresAt, password, isPublic } = req.body;
  const baseUrl = process.env.BASE_URL;
  
  // Validate URL
  if (!validUrl.isUri(longUrl)) {
    req.flash('error_msg', 'Please enter a valid URL');
    return res.redirect('/urls/create');
  }
  
  try {
    // Check if custom code is provided and available
    let urlCode = customCode ? customCode.trim() : nanoid(8);
    
    if (customCode) {
      // Check if custom code already exists
      const existingUrl = await Url.findOne({ urlCode });
      if (existingUrl) {
        req.flash('error_msg', 'Custom URL code is already in use. Please try another one.');
        return res.redirect('/urls/create');
      }
      
      // Validate custom code format (alphanumeric only)
      if (!/^[a-zA-Z0-9-_]+$/.test(urlCode)) {
        req.flash('error_msg', 'Custom URL code can only contain letters, numbers, hyphens, and underscores');
        return res.redirect('/urls/create');
      }
    }
    
    // Create new URL
    const shortUrl = `${baseUrl}/${urlCode}`;
    
    const newUrl = new Url({
      urlCode,
      longUrl,
      shortUrl,
      title: title || '',
      user: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      password: password || null,
      isPublic: isPublic === 'on'
    });
    
    await newUrl.save();
    
    req.flash('success_msg', 'Short URL created successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating short URL');
    res.redirect('/urls/create');
  }
});

// View URL details
router.get('/view/:id', ensureAuthenticated, checkUrlOwnership(Url), async (req, res) => {
  try {
    // URL is already attached to req.item by the middleware
    const url = req.item;
    
    // Get analytics data
    const stats = url.getClickStats();
    
    res.render('urls/view', {
      title: url.title || 'URL Details',
      url,
      stats
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error retrieving URL details');
    res.redirect('/dashboard');
  }
});

// Edit URL page
router.get('/edit/:id', ensureAuthenticated, checkUrlOwnership(Url), (req, res) => {
  const url = req.item;
  
  res.render('urls/edit', {
    title: 'Edit URL',
    url
  });
});

// Update URL
router.post('/edit/:id', ensureAuthenticated, checkUrlOwnership(Url), async (req, res) => {
  try {
    const { title, longUrl, expiresAt, password, isActive, isPublic } = req.body;
    const url = req.item;
    
    // Validate URL
    if (!validUrl.isUri(longUrl)) {
      req.flash('error_msg', 'Please enter a valid URL');
      return res.redirect(`/urls/edit/${url.id}`);
    }
    
    // Update URL fields
    url.title = title || '';
    url.longUrl = longUrl;
    url.expiresAt = expiresAt ? new Date(expiresAt) : null;
    url.password = password || null;
    url.isActive = isActive === 'on';
    url.isPublic = isPublic === 'on';
    
    await url.save();
    
    req.flash('success_msg', 'URL updated successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating URL');
    res.redirect(`/urls/edit/${req.params.id}`);
  }
});

// Delete URL
router.post('/delete/:id', ensureAuthenticated, checkUrlOwnership(Url), async (req, res) => {
  try {
    await Url.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', 'URL deleted successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting URL');
    res.redirect('/dashboard');
  }
});

// Public URLs directory
router.get('/public', async (req, res) => {
  try {
    // Get public URLs, sorted by creation date
    const urls = await Url.find({ isPublic: true, isActive: true })
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .limit(50);
    
    res.render('urls/public', {
      title: 'Public URLs Directory',
      urls
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error fetching public URLs');
    res.redirect('/');
  }
});

module.exports = router;