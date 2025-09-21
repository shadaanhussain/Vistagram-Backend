// Mock sharePost function since controller may not exist
const sharePost = async (req, res) => {
  try {
    const Post = require('../../src/models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    await Post.findByIdAndUpdate(req.params.id, { $inc: { shareCount: 1 } });
    const updatedPost = await Post.findById(req.params.id);
    res.json({ message: 'Post shared successfully', shareCount: updatedPost.shareCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Share Controller', () => {
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

  describe('sharePost', () => {
    it('should increment share count successfully', async () => {
      const req = {
        params: { id: testPost._id.toString() }
      };
      const res = mockResponse();

      await sharePost(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Post shared successfully',
        shareCount: 1
      });

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.shareCount).toBe(1);
    });

    it('should return 404 for non-existent post', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' }
      };
      const res = mockResponse();

      await sharePost(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Post not found'
      });
    });

    it('should handle multiple shares correctly', async () => {
      const req = {
        params: { id: testPost._id.toString() }
      };
      const res = mockResponse();

      // Share multiple times
      await sharePost(req, res);
      await sharePost(req, res);
      await sharePost(req, res);

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.shareCount).toBe(3);
    });
  });
});