const express = require('express');
const cronService = require('../services/cronService');

const router = express.Router();

// Get cron job status
router.get('/cron/status', (req, res) => {
  const status = cronService.getJobStatus();
  res.json({
    success: true,
    jobs: status,
    enabled: process.env.CRON_ENABLED === 'true',
    schedule: process.env.CRON_SCHEDULE || '0 12 * * *'
  });
});

// Manually trigger database population
router.post('/cron/trigger', async (req, res) => {
  try {
    console.log('🔧 Manual cron trigger requested via API');
    await cronService.triggerPopulateDatabase();
    
    res.json({
      success: true,
      message: 'Database population triggered successfully'
    });
  } catch (error) {
    console.error('❌ Manual cron trigger failed:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;