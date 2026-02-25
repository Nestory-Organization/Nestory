const express = require('express');
const router = express.Router();

const { searchExternalBooks } = require('../../controllers/storyLibrary/storyController');
const { protect, admin } = require('../../middleware/authMiddleware');
const storyController = require('../../controllers/storyLibrary/storyController');

//Public: Google Books Search
// GET /api/stories/search?q=harry%20potter
router.get('/google/search', searchExternalBooks);

//Public
router.get('/', storyController.getStories);
router.get('/:id', storyController.getStoryById);

//Admin
router.post('/', protect, admin, storyController.createStory);
router.put('/:id', protect, admin, storyController.updateStory);
router.delete('/:id', protect, admin, storyController.deleteStory);

module.exports = router;