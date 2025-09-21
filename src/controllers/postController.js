const Post = require('../models/Post');

const createPost = async (req, res) => {
  try {
    // req.user comes from authenticateToken middleware
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const post = new Post({
      user: userId,               // store username instead of userId
      imageUrl: req.file.path,
      caption: req.body.caption || ''
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    
    // Add likedByUser status for authenticated users
    const userId = req.user?._id;
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.likesCount = post.likes.length;
      postObj.likedByUser = userId ? post.likes.includes(userId) : false;
      return postObj;
    });
    
    res.json(postsWithLikeStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('user', 'username');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Add likedByUser status for authenticated users
    const postObj = post.toObject();
    const userId = req.user?._id;
    postObj.likesCount = post.likes.length;
    postObj.likedByUser = userId ? post.likes.includes(userId) : false;
    
    res.json(postObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPost, getAllPosts, getPostById };