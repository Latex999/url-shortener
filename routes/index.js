const express = require('express');
const router = express.Router();
const Url = require('../models/Url');
const { ensureAuthenticated } = require('../middleware/auth');
const UAParser = require('ua-parser-js');

// Home page route
router.get('/', (req, res) => {
  res.render('index', {
    title: 'URL Shortener - Shorten Your Links',
    user: req.user
  });
});

// Dashboard route
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    // Get user's URLs
    const urls = await Url.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // Calculate some basic stats
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    const totalUrls = urls.length;
    const topUrls = [...urls].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    
    res.render('dashboard', {
      title: 'Dashboard',
      urls,
      totalClicks,
      totalUrls,
      topUrls
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred while fetching your URLs');
    res.redirect('/');
  }
});

// Redirect route
router.get('/:code', async (req, res) => {
  try {
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).render('404', {
        title: 'Link Not Found',
        message: 'The requested short URL does not exist.'
      });
    }
    
    // Check if URL is active and not expired
    if (!url.isActive) {
      return res.status(403).render('error', {
        title: 'Link Inactive',
        error: 'This link has been deactivated by the owner.'
      });
    }
    
    if (url.isExpired()) {
      return res.status(410).render('error', {
        title: 'Link Expired',
        error: 'This link has expired and is no longer available.'
      });
    }
    
    // Check if URL is password protected
    if (url.password && !req.session.accessedUrls?.includes(url.id)) {
      return res.render('password-prompt', {
        title: 'Protected Link',
        urlCode: url.urlCode
      });
    }
    
    // Parse user agent for analytics
    const parser = new UAParser(req.headers['user-agent']);
    const parsedUserAgent = parser.getResult();
    
    // Record click with details
    await url.recordClick({
      ip: req.ip,
      referrer: req.headers.referer || '',
      browser: parsedUserAgent.browser.name || '',
      os: parsedUserAgent.os.name || '',
      device: parsedUserAgent.device.type || 'desktop'
    });
    
    // Redirect to the long URL
    return res.redirect(url.longUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).render('error', {
      title: 'Server Error',
      error: 'Something went wrong. Please try again.'
    });
  }
});

// Handle password protected URLs
router.post('/:code/access', async (req, res) => {
  try {
    const { password } = req.body;
    const url = await Url.findOne({ urlCode: req.params.code });
    
    if (!url) {
      return res.status(404).render('404', {
        title: 'Link Not Found'
      });
    }
    
    // Check if password matches
    if (url.password !== password) {
      return res.render('password-prompt', {
        title: 'Protected Link',
        urlCode: url.urlCode,
        error: 'Incorrect password. Please try again.'
      });
    }
    
    // Store access in session
    if (!req.session.accessedUrls) {
      req.session.accessedUrls = [];
    }
    req.session.accessedUrls.push(url.id);
    
    // Redirect to the URL
    return res.redirect(`/${url.urlCode}`);
  } catch (err) {
    console.error(err);
    return res.status(500).render('error', {
      title: 'Server Error',
      error: 'Something went wrong. Please try again.'
    });
  }
});

module.exports = router;