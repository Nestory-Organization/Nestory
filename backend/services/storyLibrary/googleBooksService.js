const axios = require('axios');

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

exports.searchGoogleBooks = async (q) => {
    const res = await axios.get(GOOGLE_BOOKS_URL, {
        params: {
            q,
            key: process.env.GOOGLE_BOOKS_API_KEY,
            maxResults: 10
        }
    });

    const items = res.data.items || [];

    return items.map((item) => ({
        googleBookID: item.id,
        title: item.volumeInfo.title || 'Unknown',
        author: item.volumeInfo.authors?.[0] || 'Unknown',
        description: item.volumeInfo.description || '',
        coverImage: item.volumeInfo.imageLinks?.thumbnail || '',
        previewLink: item.volumeInfo.previewLink || ''
    }));
};
