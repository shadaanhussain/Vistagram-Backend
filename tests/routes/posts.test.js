const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const postRoutes = require('../../src/routes/postRoutes');
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const bcrypt = require('bcrypt');

// Mock Cloudinary config
jest.mock('../../src/config/cloudinary', () => ({
  upload: {
    single: () => (req, res, next) => {
      req.file = { path: 'test-image-path' };
      next();
    }
  }
}));

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg'
      })
    }
  }
}));

const app = express();
app.use(express.json());
app.use('/api/posts', postRoutes);

describe('Post Routes', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10)
    });

    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/posts', () => {
    it('should get all posts successfully', async () => {
      await Post.create({
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post'
      });

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          caption: 'Test post'
        })
      );
    });
  });

  describe('POST /api/posts/:id/like', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post',
        likes: []
      });
    });

    it('should like a post successfully', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Post liked',
        liked: true,
        likesCount: 1
      });
    });

    it('should return 401 for unauthenticated user', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/like`)
        .expect(401);
    });
  });
});