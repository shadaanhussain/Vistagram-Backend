const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../src/middlewares/auth');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  let testUser;
  let validToken;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10)
    });

    validToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    mockNext.mockClear();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return 401 when no token provided', async () => {
      const req = { headers: {} };
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access token required'
      });
    });

    it('should return 401 when token is invalid', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = mockResponse();

      await authenticateToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token'
      });
    });
  });
});