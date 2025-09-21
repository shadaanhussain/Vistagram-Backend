const { toggleLike } = require('../../src/controllers/likeController');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Like Controller', () => {
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
      likes: []
    });
  });

  describe('toggleLike', () => {
    it('should like a post successfully', async () => {
      const req = {
        params: { id: testPost._id.toString() },
        user: testUser
      };
      const res = mockResponse();

      await toggleLike(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Post liked',
        liked: true,
        likesCount: 1
      });
    });

    it('should unlike a post successfully', async () => {
      await Post.findByIdAndUpdate(testPost._id, {
        $addToSet: { likes: testUser._id }
      });

      const req = {
        params: { id: testPost._id.toString() },
        user: testUser
      };
      const res = mockResponse();

      await toggleLike(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: 'Post unliked',
        liked: false,
        likesCount: 0
      });
    });

    it('should return 404 for non-existent post', async () => {
      const req = {
        params: { id: '507f1f77bcf86cd799439011' },
        user: testUser
      };
      const res = mockResponse();

      await toggleLike(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});