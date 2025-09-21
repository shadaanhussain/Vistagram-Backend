const { createPost, getAllPosts, getPostById } = require('../../src/controllers/postController');
const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg'
      })
    }
  }
}));

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Post Controller', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10)
    });
  });

  describe('createPost', () => {
    it('should create a new post successfully', async () => {
      const req = {
        user: testUser,
        body: { caption: 'Test caption' },
        file: { path: 'test-image-path' }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          caption: 'Test caption'
        })
      );
    });

    it('should return error when no image provided', async () => {
      const req = {
        user: testUser,
        body: { caption: 'Test caption' }
      };
      const res = mockResponse();

      await createPost(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAllPosts', () => {
    it('should get all posts successfully', async () => {
      await Post.create({
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post'
      });

      const req = { user: testUser };
      const res = mockResponse();

      await getAllPosts(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          caption: 'Test post'
        })
      ]);
    });
  });
});