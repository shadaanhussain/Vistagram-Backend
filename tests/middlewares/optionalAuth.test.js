const jwt = require('jsonwebtoken');
const { optionalAuth } = require('../../src/middlewares/optionalAuth');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Optional Auth Middleware', () => {
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

  describe('optionalAuth', () => {
    it('should authenticate valid token and set user', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when no token provided', async () => {
      const req = { headers: {} };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when token is invalid', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when token is expired', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '-1h' }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user when user does not exist', async () => {
      await User.findByIdAndDelete(testUser._id);

      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const res = mockResponse();

      await optionalAuth(req, res, mockNext);

      expect(req.user).toBeNull();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});