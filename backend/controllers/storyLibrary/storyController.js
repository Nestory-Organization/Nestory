const successResponse = require('../../utils/responseFormatter');
const { searchGoogleBooks } = require('../../services/storyLibrary/googleBooksService');

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
