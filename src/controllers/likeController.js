const Like = require('../models/Like');
const Post = require('../models/Post');

const toggleLike = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const hasLiked = post.likes.includes(userId);
    
    if (hasLiked) {
      // Unlike: remove user from likes array
      await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
      res.json({ 
        message: 'Post unliked', 
        liked: false, 
        likesCount: post.likes.length - 1 
      });
    } else {
      // Like: add user to likes array
      await Post.findByIdAndUpdate(postId, { $addToSet: { likes: userId } });
      res.json({ 
        message: 'Post liked', 
        liked: true, 
        likesCount: post.likes.length + 1 
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPostLikes = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const post = await Post.findById(postId).populate('likes', 'username');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ 
      likesCount: post.likes.length, 
      users: post.likes 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { toggleLike, getPostLikes };