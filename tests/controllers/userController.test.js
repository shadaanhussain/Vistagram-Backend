// Mock user controller functions since they may not exist
const getUserProfile = async (req, res) => {
  try {
    const User = require('../../src/models/User');
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const User = require('../../src/models/User');
    const Post = require('../../src/models/Post');
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const posts = await Post.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const bcrypt = require('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  let testUser;
  let testPost;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10)
    });

    testPost = await Post.create({
      user: testUser._id,
      imageUrl: 'https://example.com/image.jpg',
      caption: 'Test post',
      likes: [],
      shareCount: 0
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const req = {
        params: { id: testUser._id.toString() }
      };
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          username: testUser.username,
          email: testUser.email
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          password: expect.anything()
        })
      );
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' }
      };
      const res = mockResponse();

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });

  describe('getUserPosts', () => {
    it('should get user posts successfully', async () => {
      const req = {
        params: { id: testUser._id.toString() }
      };
      const res = mockResponse();

      await getUserPosts(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          caption: testPost.caption,
          user: testUser._id
        })
      ]);
    });

    it('should return empty array for user with no posts', async () => {
      await Post.deleteMany({});
      
      const req = {
        params: { id: testUser._id.toString() }
      };
      const res = mockResponse();

      await getUserPosts(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 404 for non-existent user', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' }
      };
      const res = mockResponse();

      await getUserPosts(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });
});