const axios = require('axios');

const GOOGLE_BOOKS_URL = 'https://www.googleapis.com/books/v1/volumes';

exports.searchGoogleBooks = async (q) => {
    const params = { q, maxResults:10 };
    if (process.env.GOOGLE_BOOKS_API_KEY) params.key = process.env.GOOGLE_BOOKS_API_KEY;

    const res = await axios.get(GOOGLE_BOOKS_URL, { params });
    const items = res.data.items || [];

    return items.map((item) => ({
        googleBookId: item.id,
        title: item.volumeInfo.title || 'Unknown',
        author: item.volumeInfo.authors?.[0] || 'Unknown',
        description: item.volumeInfo.description || '',
        coverImage: item.volumeInfo.imageLinks?.thumbnail || '',
        previewLink: item.volumeInfo.previewLink || ''
    }));
};

//get full metadata by Google volume id
exports.getGoogleBookById = async (googleBookId) => {
    const params = {};
    if (process.env.GOOGLE_BOOKS_API_KEY) params.key = process.env.GOOGLE_BOOKS_API_KEY;
    
    const res = await axios.get(`${GOOGLE_BOOKS_URL}/${googleBookId}`, { params });

    const v = res.data?.volumeInfo || {};
    return {
        googleBookId,
        title: v.title || 'Unknown',
        author: v.authors?.[0] || 'Unknown',
        description: v.description || '',
        coverImage: v.imageLinks?.thumbnail || '',
        previewLink: v.previewLink || ''
    };
};

exports.getBookById = async (googleBookId) => {
    const params = {};

    if (process.env.GOOGLE_BOOKS_API_KEY) {
        params.key = process.env.GOOGLE_BOOKS_API_KEY;
    }

    const response = await axios.get(
        `${GOOGLE_BOOKS_URL}/${googleBookId}`,
        { params }
    );

    const volume = response.data?.volumeInfo || {};

    return {
        googleBookId,
        title: volume.title || "Unknown",
        author: volume.authors
            ? volume.authors.join(", ")
            : "Unknown",
        description: volume.description || "",
        coverImage: volume.imageLinks?.thumbnail || "",
        previewLink: volume.previewLink || "",
    };
};