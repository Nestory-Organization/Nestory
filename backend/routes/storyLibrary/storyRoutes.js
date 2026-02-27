const express = require('express');
const router = express.Router();

const { protect, admin } = require('../../middleware/authMiddleware');
const storyController = require('../../controllers/storyLibrary/storyController');
const storySyncController = require('../../controllers/storyLibrary/storySyncController');

//Public: Google 
// GET /api/stories/search?q=harry%20potter
router.get('/google/search', storyController.searchExternalBooks);

//Google (admin)
//POST /api/stories/google/import/:googleBookId
router.post('/google/import/:googleBookId', protect, admin, storyController.importGoogleBook);

//PUT /api/stories/google/sync/:id
// PUT /api/stories/google/sync/:storyId
router.put('/google/sync/:storyId', protect, admin, storySyncController.syncStoryMetadata);

//Public
router.get('/', storyController.getStories);
router.get('/:id', storyController.getStoryById);

//Admin
router.post('/', protect, admin, storyController.createStory);
router.put('/:id', protect, admin, storyController.updateStory);
router.delete('/:id', protect, admin, storyController.deleteStory);

module.exports = router;