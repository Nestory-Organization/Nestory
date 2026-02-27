const express = require('express');
const router = express.Router();

const { searchExternalBooks } = require('../../controllers/storyLibrary/storyController');
const { protect, admin } = require('../../middleware/authMiddleware');
const storyController = require('../../controllers/storyLibrary/storyController');
const { checkStoryAccess } = require('../../controllers/storyLibrary/storyAccessController');

//Public: Google Books Search
// GET /api/stories/search?q=harry%20potter
router.get('/google/search', searchExternalBooks);

//Public
router.get('/', protect, storyController.getStories);
router.get('/:id', storyController.getStoryById);
// Age restriction check (Child age vs Story ageGroup)
router.get('/:storyId/access/:childId', protect, checkStoryAccess);

//Admin
router.post('/', protect, admin, storyController.createStory);
router.put('/:id', protect, admin, storyController.updateStory);
router.delete('/:id', protect, admin, storyController.deleteStory);

module.exports = router;