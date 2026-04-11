// tests/storyLibrary/unit/googleBooksService.test.js

jest.mock('axios');

const googleBooksService = require('services/googleBooksService');
const axios = require('axios');

describe('Google Books Service - Unit Tests', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch and map Google Books data', async () => {

    axios.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 'abc123',
            volumeInfo: {
              title: 'Google Book',
              authors: ['Author X'],
              description: 'Test description',
              imageLinks: {
                thumbnail: 'http://image-url'
              },
              previewLink: 'http://preview',
              pageCount: 250
            }
          }
        ]
      }
    });

    const result = await googleBooksService.searchGoogleBooks('test');

    expect(result.length).toBe(1);
    expect(result[0].googleBookId).toBe('abc123');
    expect(result[0].title).toBe('Google Book');
    expect(result[0].author).toBe('Author X');
    expect(result[0].pageCount).toBe(250);
  });

  test('should return empty array if no results', async () => {

    axios.get.mockResolvedValue({ data: { items: [] } });

    const result = await googleBooksService.searchGoogleBooks('nothing');

    expect(result).toEqual([]);
  });

});