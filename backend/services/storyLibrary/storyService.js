const Story = require('../../models/storyLibrary/Story');
const Child = require('../../models/Child');

const mapAgeToGroup = (age) => {
    if (age <= 3) return 'toddler';
    if (age <= 7) return 'early-reader';
    if (age <= 12) return 'middle-grade';
    return 'young-adult';
};

exports.listStories = async (query, user) => {
    const { page = 1, limit = 10, search, ageGroup, genre, readingLevel } = query;

    const filter = {};
    if (user && user.ageGroup) {
        filter.ageGroup = user.ageGroup;
    } else if (ageGroup) { 
        filter.ageGroup = ageGroup;
    }
    
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
