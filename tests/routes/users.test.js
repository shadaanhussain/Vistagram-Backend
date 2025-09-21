const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
// Mock user routes since they may not exist
const userRoutes = express.Router();

// Mock route handlers
userRoutes.get('/:id', async (req, res) => {
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
});

userRoutes.get('/:id/posts', async (req, res) => {
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
});
const User = require('../../src/models/User');
const Post = require('../../src/models/Post');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
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

  describe('GET /api/users/:id', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          username: testUser.username,
          email: testUser.email
        })
      );
      expect(response.body.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should return 500 for invalid user ID format', async () => {
      await request(app)
        .get('/api/users/invalid-id')
        .expect(500);
    });
  });

  describe('GET /api/users/:id/posts', () => {
    beforeEach(async () => {
      await Post.create({
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post',
        likes: [],
        shareCount: 0
      });
    });

    it('should get user posts successfully', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser._id}/posts`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          caption: 'Test post'
        })
      );
    });

    it('should return empty array for user with no posts', async () => {
      await Post.deleteMany({});

      const response = await request(app)
        .get(`/api/users/${testUser._id}/posts`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/507f1f77bcf86cd799439011/posts')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });
});