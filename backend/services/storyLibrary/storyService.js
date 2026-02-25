const Story = require('../../models/storyLibrary/Story');

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
