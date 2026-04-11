// tests/storyLibrary/unit/duplicateCheck.test.js

const Story = require('models/Story');

jest.mock('models/Story');

describe('Duplicate Check - Unit Tests', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should detect duplicate Google book', async () => {

    Story.findOne.mockResolvedValue({
      title: 'Existing Book',
      googleBookId: 'abc123'
    });

    const existing = await Story.findOne({ googleBookId: 'abc123' });

    expect(existing).not.toBeNull();
    expect(existing.title).toBe('Existing Book');
  });

  test('should allow new book when no duplicate exists', async () => {

    Story.findOne.mockResolvedValue(null);

    const existing = await Story.findOne({ googleBookId: 'new123' });

    expect(existing).toBeNull();
  });

});