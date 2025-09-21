const express = require('express');
const { upload } = require('../config/cloudinary');
const { createPost, getAllPosts, getPostById } = require('../controllers/postController');
const { toggleLike, getPostLikes } = require('../controllers/likeController');
const { sharePost } = require('../controllers/shareController');
const { authenticateToken } = require('../middlewares/auth');
const { optionalAuth } = require('../middlewares/optionalAuth');

const router = express.Router();

router.post('/', authenticateToken, upload.single('image'), createPost);
router.get('/', optionalAuth, getAllPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/:id/like', authenticateToken, toggleLike);
router.get('/:id/likes', getPostLikes);
router.post('/:id/share', sharePost);

module.exports = router;