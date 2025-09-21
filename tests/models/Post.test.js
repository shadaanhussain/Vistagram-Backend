const Post = require('../../src/models/Post');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

describe('Post Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10)
    });
  });

  describe('Post creation', () => {
    it('should create a post with valid data', async () => {
      const postData = {
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post caption',
        likes: [],
        shareCount: 0
      };

      const post = await Post.create(postData);

      expect(post.user.toString()).toBe(testUser._id.toString());
      expect(post.imageUrl).toBe(postData.imageUrl);
      expect(post.caption).toBe(postData.caption);
      expect(post.likes).toEqual([]);
      expect(post.shareCount).toBe(0);
      expect(post._id).toBeDefined();
      expect(post.createdAt).toBeDefined();
    });

    it('should require user', async () => {
      const postData = {
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post caption'
      };

      await expect(Post.create(postData)).rejects.toThrow();
    });

    it('should require imageUrl', async () => {
      const postData = {
        user: testUser._id,
        caption: 'Test post caption'
      };

      await expect(Post.create(postData)).rejects.toThrow();
    });

    it('should create post without caption', async () => {
      const postData = {
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg'
      };

      const post = await Post.create(postData);
      expect(post.caption).toBe('');
    });

    it('should default likes to empty array', async () => {
      const postData = {
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post'
      };

      const post = await Post.create(postData);
      expect(post.likes).toEqual([]);
    });

    it('should default shareCount to 0', async () => {
      const postData = {
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post'
      };

      const post = await Post.create(postData);
      expect(post.shareCount).toBe(0);
    });
  });

  describe('Post operations', () => {
    let testPost;

    beforeEach(async () => {
      testPost = await Post.create({
        user: testUser._id,
        imageUrl: 'https://example.com/image.jpg',
        caption: 'Test post',
        likes: [],
        shareCount: 0
      });
    });

    it('should populate user data', async () => {
      const post = await Post.findById(testPost._id).populate('user', 'username');
      
      expect(post.user.username).toBe(testUser.username);
      expect(post.user.password).toBeUndefined();
    });

    it('should add likes correctly', async () => {
      await Post.findByIdAndUpdate(testPost._id, {
        $addToSet: { likes: testUser._id }
      });

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.likes).toContainEqual(testUser._id);
      expect(updatedPost.likes.length).toBe(1);
    });

    it('should remove likes correctly', async () => {
      await Post.findByIdAndUpdate(testPost._id, {
        $addToSet: { likes: testUser._id }
      });

      await Post.findByIdAndUpdate(testPost._id, {
        $pull: { likes: testUser._id }
      });

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.likes).not.toContainEqual(testUser._id);
      expect(updatedPost.likes.length).toBe(0);
    });

    it('should increment share count', async () => {
      await Post.findByIdAndUpdate(testPost._id, {
        $inc: { shareCount: 1 }
      });

      const updatedPost = await Post.findById(testPost._id);
      expect(updatedPost.shareCount).toBe(1);
    });
  });
});