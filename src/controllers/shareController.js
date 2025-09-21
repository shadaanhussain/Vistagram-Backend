const Post = require('../models/Post');

const sharePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    
    const post = await Post.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ message: 'Post shared', shareCount: post.shareCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { sharePost };