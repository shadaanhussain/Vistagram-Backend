const cron = require('node-cron');
const { populateDatabase } = require('../../scripts/populateDatabase');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start the cron job for database population
  startDatabasePopulation() {
    const schedule = process.env.CRON_SCHEDULE || '0 12 * * *'; // Default: 12 PM daily
    const enabled = process.env.CRON_ENABLED === 'true';

    if (!enabled) {
      console.log('📅 Cron jobs disabled via environment variable');
      return;
    }

    if (this.jobs.has('populate')) {
      console.log('📅 Database population cron job already running');
      return;
    }

    console.log(`📅 Starting database population cron job: ${schedule}`);

    const job = cron.schedule(schedule, async () => {
      await this.runPopulateDatabase();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    this.jobs.set('populate', job);
    console.log('✅ Database population cron job started successfully');
  }

  // Execute database population with error handling
  async runPopulateDatabase() {
    if (this.isRunning) {
      console.log('⚠️ Database population already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = new Date();

    try {
      console.log(`🚀 [${startTime.toISOString()}] Starting scheduled database population`);
      
      await populateDatabase();
      
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`✅ [${endTime.toISOString()}] Database population completed successfully in ${duration}ms`);
      
    } catch (error) {
      const endTime = new Date();
      console.error(`❌ [${endTime.toISOString()}] Database population failed:`, error.message);
      console.error('Stack trace:', error.stack);
      
      // Could add additional error reporting here (email, Slack, etc.)
      
    } finally {
      this.isRunning = false;
    }
  }

  // Stop a specific cron job
  stopJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`🛑 Stopped cron job: ${jobName}`);
    }
  }

  // Stop all cron jobs
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 Stopped cron job: ${name}`);
    });
    this.jobs.clear();
  }

  // Get status of all jobs
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    });
    return status;
  }

  // Manual trigger for testing
  async triggerPopulateDatabase() {
    console.log('🔧 Manually triggering database population');
    await this.runPopulateDatabase();
  }
}

module.exports = new CronService();