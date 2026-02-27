const Story = require('../../models/storyLibrary/Story');
const { getGoogleBookById } = require('./googleBooksService');
const { getStoriesWithQuery } = require("./storyQueryService");

exports.listStories = async (query) => {
    const { page = 1, limit = 10, search, ageGroup, genre, readingLevel } = query;

    const filter = {};
    if (ageGroup) filter.ageGroup = ageGroup;
    if (readingLevel) filter.readingLevel = readingLevel;
    if (genre) filter.genres = { $in: [genre] };

    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { author: {$regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }  
        ];
    }

    const skip = (Number(page) - 1) * Number(limit); // Calculate how many documents to skip based on the current page and limit

    const [stories, total] = await Promise.all([
        Story.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
        Story.countDocuments(filter)
    ]);

    return {
        stories,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
    };
};
exports.getStoryById = async (id) => {
    return Story.findById(id);
};

exports.createStory = async (payload, userId) => {
    return Story.create({
        ...payload,
        createdBy: userId,
        source: 'internal'
    });
};

exports.updateStory = async (id, payload) => {
    return Story.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
};

exports.deleteStory = async (id) => {
    return Story.findByIdAndDelete(id);
};

//import Google Book into DB (Admin)
exports.importGoogleBook = async (googleBookId, defaults, userId) => {
    //fetch metadata from Google
    const meta = await getGoogleBookById(googleBookId);

    //Prevent duplicate import
    const exists = await Story.findOne({ googleBookId });
    if (exists) {
        const err = new Error('This Google book has already been imported');
        err.statusCode = 400;
        throw err;
    }

    //create internal story 
    const story = await Story.create({
        title: meta.title,
        author: meta.author,
        description: meta.description,
        coverImage: meta.coverImage,
        previewLink: meta.previewLink,
        googleBookId: meta.googleBookId,
        source: 'google',

        //defaults from admin input
        ageGroup: defaults.ageGroup,
        genres: defaults.genres,
        readingLevel: defaults.readingLevel || 'intermediate',

        createdBy: userId
    });
    return story;
};

//Sync Google metadata for an imported story (Admin)
exports.syncGoogleMetadata = async (storyId) => {
    const story = await Story.findById(storyId);
    if (!story) {
        const err = new Error('Story not found');
        err.statusCode = 404;
        throw err;
    }
    if (!story.googleBookId) {
        const err = new Error('This story has no GoogleBookID to sync');
        err.statusCode = 400;
        throw err;
    }
    const meta = await getGoogleBookById(story.googleBookId);

    story.title = meta.title;
    story.author = meta.author;
    story.description = meta.description;
    story.coverImage = meta.coverImage;
    story.previewLink = meta.previewLink;

    const updated = await story.save();
    return updated;
};
exports.listStories = async (query) => {
    return getStoriesWithQuery(query);
};