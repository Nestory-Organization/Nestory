const successResponse = require('../../utils/responseFormatter');
const { searchGoogleBooks } = require('../../services/storyLibrary/googleBooksService');
const storyService = require('../../services/storyLibrary/storyService');


exports.searchExternalBooks = async (req, res, next) => {
    try {
        const q = req.query.q;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Query parameter "q" is required'
            });
        }

        const results = await searchGoogleBooks(q);
        return successResponse(res, 200, 'Google Books results fetched', results);
    } catch (err) {
        next(err);
    }
};

//GET /api/stories
exports.getStories = async (req, res, next) => {
    try {
        const result = await storyService.listStories(req.query);
        return successResponse(res, 200, 'Stories fetched successfully', result);
    } catch (err) {
        next(err);
    }
};

//GET /api/stories/:id
exports.getStoryById = async (req, res, next) => {
    try {
        const story = await storyService.getStoryById(req.params.id);
        if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

        return successResponse(res, 200, 'Story fetched successfully', story);
    } catch (err) {
        next(err);
    }
};

//POST /api/stories (admin)
exports.createStory = async (req, res, next) => {
    try {
        const story = await storyService.createStory(req.body, req.user._id);
        return successResponse(res, 201, 'Story created successfully', story);
    } catch (err) {
        next(err);
    }
};

//PUT /api/stories/:id (admin)
exports.updateStory = async (req, res, next) => {
    try {
        const story = await storyService.updateStory(req.params.id, req.body);
        if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

        return successResponse(res, 200, 'Story updated successfully', story);
    } catch (err) {
        next(err);
    }
};

//DELETE /api/stories/:id (admin)
exports.deleteStory = async (req, res, next) => {
    try {
        const story = await storyService.deleteStory(req.params.id);
        if (!story) return res.status(404),json({ success:false, message: 'Story not found' });

        return successResponse(res, 200, 'Story deleted successfully');
    } catch (err) {
        next(err);
    }
};