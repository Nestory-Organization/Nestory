// tests/storyLibrary/unit/storyService.test.js

const StoryService = require('services/storyService');
const Story = require('models/Story');

jest.mock('models/Story');

describe('Story Service - Unit Tests', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create a story successfully', async () => {
    const mockInput = {
      title: 'Test Book',
      author: 'Test Author',
      genres: ['General'],
    };

    const mockSaved = { ...mockInput, _id: '123', createdBy: 'user123', source: 'internal' };

    Story.create.mockResolvedValue(mockSaved);

    const result = await StoryService.createStory(mockInput, 'user123');

    expect(Story.create).toHaveBeenCalledWith({
      ...mockInput,
      createdBy: 'user123',
      source: 'internal'
    });
    expect(result._id).toBe('123');
    expect(result.title).toBe('Test Book');
  });

  test('should return paginated stories', async () => {
    const mockStories = [{ title: 'Book 1' }];

    Story.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve(mockStories)
        })
      })
    });

    Story.countDocuments.mockResolvedValue(1);

    const result = await StoryService.listStories({
      page: 1,
      limit: 10
    });

    expect(result.stories).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
  });

});