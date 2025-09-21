const request = require('supertest');
const express = require('express');

// Mock cronService before requiring routes
jest.mock('../../src/services/cronService', () => ({
  getJobStatus: jest.fn(),
  triggerPopulateDatabase: jest.fn()
}));

const cronRoutes = require('../../src/routes/cronRoutes');
const mockCronService = require('../../src/services/cronService');

const app = express();
app.use(express.json());
app.use('/api', cronRoutes);

describe('Cron Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_ENABLED = 'true';
    process.env.CRON_SCHEDULE = '0 12 * * *';
  });

  describe('GET /api/cron/status', () => {
    it('should return cron job status successfully', async () => {
      const mockStatus = {
        populate: {
          running: true,
          scheduled: true
        }
      };
      mockCronService.getJobStatus.mockReturnValue(mockStatus);

      const response = await request(app)
        .get('/api/cron/status')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        jobs: mockStatus,
        enabled: true,
        schedule: '0 12 * * *'
      });
    });

    it('should return disabled status when cron is disabled', async () => {
      process.env.CRON_ENABLED = 'false';
      mockCronService.getJobStatus.mockReturnValue({});

      const response = await request(app)
        .get('/api/cron/status')
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });

    it('should return default schedule when not set', async () => {
      delete process.env.CRON_SCHEDULE;
      mockCronService.getJobStatus.mockReturnValue({});

      const response = await request(app)
        .get('/api/cron/status')
        .expect(200);

      expect(response.body.schedule).toBe('0 12 * * *');
    });
  });

  describe('POST /api/cron/trigger', () => {
    it('should trigger database population successfully', async () => {
      mockCronService.triggerPopulateDatabase.mockResolvedValue();

      const response = await request(app)
        .post('/api/cron/trigger')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Database population triggered successfully'
      });
      expect(mockCronService.triggerPopulateDatabase).toHaveBeenCalledTimes(1);
    });

    it('should return error when trigger fails', async () => {
      const error = new Error('Database connection failed');
      mockCronService.triggerPopulateDatabase.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/cron/trigger')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Database connection failed'
      });
    });

    it('should handle unknown errors gracefully', async () => {
      mockCronService.triggerPopulateDatabase.mockRejectedValue(new Error());

      const response = await request(app)
        .post('/api/cron/trigger')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });
  });
});