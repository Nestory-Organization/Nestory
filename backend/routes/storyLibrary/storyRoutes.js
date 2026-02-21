const express = require('express');
const router = express.Router();

const { searchExternalBooks } = require('../../controllers/storyLibrary/storyController');

//Public: Google Books Search
// GET /api/stories/search?q=harry%20potter
router.get('/google/search', searchExternalBooks);

module.exports = router;