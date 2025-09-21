const cronService = require('../../src/services/cronService');

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({
    start: jest.fn(),
    stop: jest.fn(),
    running: true,
    scheduled: true
  })
}));

// Mock populateDatabase
jest.mock('../../scripts/populateDatabase', () => ({
  populateDatabase: jest.fn()
}));

describe('Cron Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_ENABLED = 'true';
    process.env.CRON_SCHEDULE = '0 12 * * *';
  });

  describe('startDatabasePopulation', () => {
    it('should start cron job when enabled', () => {
      const cron = require('node-cron');
      
      cronService.startDatabasePopulation();

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 12 * * *',
        expect.any(Function),
        expect.objectContaining({
          scheduled: true,
          timezone: 'UTC'
        })
      );
    });

    it('should not start cron job when disabled', () => {
      process.env.CRON_ENABLED = 'false';
      const cron = require('node-cron');
      
      cronService.startDatabasePopulation();

      expect(cron.schedule).not.toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    it('should have getJobStatus method', () => {
      expect(typeof cronService.getJobStatus).toBe('function');
    });
  });

  describe('triggerPopulateDatabase', () => {
    it('should manually trigger database population', async () => {
      const { populateDatabase } = require('../../scripts/populateDatabase');
      populateDatabase.mockResolvedValueOnce();

      await cronService.triggerPopulateDatabase();

      expect(populateDatabase).toHaveBeenCalledTimes(1);
    });
  });
});