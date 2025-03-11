const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const ClickSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  },
  referrer: {
    type: String
  },
  browser: {
    type: String
  },
  os: {
    type: String
  },
  device: {
    type: String
  },
  location: {
    type: String
  }
}, { _id: false });

const UrlSchema = new mongoose.Schema({
  urlCode: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(8) // Generate a short, unique ID
  },
  longUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true
  },
  title: {
    type: String
  },
  description: {
    type: String
  },
  customDomain: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  clickDetails: [ClickSchema],
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for performance
UrlSchema.index({ urlCode: 1 });
UrlSchema.index({ user: 1 });
UrlSchema.index({ createdAt: 1 });
UrlSchema.index({ tags: 1 });

// Virtual for calculating click rate over time
UrlSchema.virtual('clickRate').get(function() {
  // If created less than an hour ago, return 0 to avoid division by zero issues
  const hoursActive = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  if (hoursActive < 1) return 0;
  
  return this.clicks / hoursActive;
});

// Method to record click details
UrlSchema.methods.recordClick = async function(clickInfo) {
  this.clicks += 1;
  
  // Add click details if provided
  if (clickInfo) {
    this.clickDetails.push({
      timestamp: new Date(),
      ip: clickInfo.ip || '',
      referrer: clickInfo.referrer || '',
      browser: clickInfo.browser || '',
      os: clickInfo.os || '',
      device: clickInfo.device || '',
      location: clickInfo.location || ''
    });
    
    // Keep only the last 1000 click details to manage document size
    if (this.clickDetails.length > 1000) {
      this.clickDetails = this.clickDetails.slice(-1000);
    }
  }
  
  return this.save();
};

// Method to get click stats
UrlSchema.methods.getClickStats = function() {
  const stats = {
    total: this.clicks,
    browsers: {},
    os: {},
    devices: {},
    referrers: {},
    timeDistribution: {
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0,
      total: this.clicks
    }
  };
  
  const now = new Date();
  const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  this.clickDetails.forEach(click => {
    // Browser stats
    if (click.browser) {
      stats.browsers[click.browser] = (stats.browsers[click.browser] || 0) + 1;
    }
    
    // OS stats
    if (click.os) {
      stats.os[click.os] = (stats.os[click.os] || 0) + 1;
    }
    
    // Device stats
    if (click.device) {
      stats.devices[click.device] = (stats.devices[click.device] || 0) + 1;
    }
    
    // Referrer stats
    if (click.referrer) {
      stats.referrers[click.referrer] = (stats.referrers[click.referrer] || 0) + 1;
    }
    
    // Time distribution
    const clickTime = new Date(click.timestamp);
    if (clickTime >= last24Hours) stats.timeDistribution.last24Hours++;
    if (clickTime >= last7Days) stats.timeDistribution.last7Days++;
    if (clickTime >= last30Days) stats.timeDistribution.last30Days++;
  });
  
  return stats;
};

// Method to check if URL is expired
UrlSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to check if URL is accessible (not expired and active)
UrlSchema.methods.isAccessible = function() {
  return this.isActive && !this.isExpired();
};

const Url = mongoose.model('Url', UrlSchema);

module.exports = Url;