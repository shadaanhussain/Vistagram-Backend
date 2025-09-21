const User = require('../../src/models/User');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  describe('User creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      const user = await User.create(userData);

      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });

    it('should require username', async () => {
      const userData = {
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser',
        password: await bcrypt.hash('password123', 10)
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await User.create(userData);

      const duplicateUser = {
        username: 'testuser2',
        email: 'test@example.com',
        password: await bcrypt.hash('password456', 10)
      };

      await expect(User.create(duplicateUser)).rejects.toThrow();
    });
  });

  describe('User validation', () => {
    it('should find user by email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await User.create(userData);
      const foundUser = await User.findOne({ email: 'test@example.com' });
      
      expect(foundUser).toBeTruthy();
      expect(foundUser.username).toBe('testuser');
    });

    it('should find user by username', async () => {
      const userData = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: await bcrypt.hash('password123', 10)
      };

      await User.create(userData);
      const foundUser = await User.findOne({ username: 'testuser2' });
      
      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe('test2@example.com');
    });
  });
});