const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

// Languages: te (Telugu), ta (Tamil), ml (Malayalam), kn (Kannada)
const ALL_SOUTH_LANGUAGES = 'te|ta|ml|kn';

import { CastMember, Movie } from '../types';

export const fetchSouthIndianMovies = async (page = 1, language = 'all'): Promise<Movie[]> => {
    if (!API_KEY) {
        console.warn('TMDB API Key is missing. Using mock data.');
        return MOCK_MOVIES;
    }

    let langParam = ALL_SOUTH_LANGUAGES;
    if (language === 'telugu') langParam = 'te';
    if (language === 'tamil') langParam = 'ta';
    if (language === 'malayalam') langParam = 'ml';
    // 'all' keeps the default

    // 'all' keeps the default

    try {
        // Using vote_count.gte=5 to catch almost everything
        const MAX_PAGES = 20; // Cap page depth to avoid empty results
        const safePage = page > MAX_PAGES ? (Math.floor(Math.random() * MAX_PAGES) + 1) : page;

        const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=${langParam}&sort_by=popularity.desc&page=${safePage}&vote_count.gte=5`;
        console.log('[TMDB] Requesting URL:', url.replace(API_KEY, 'HIDDEN'));
        const response = await fetch(url);
        const data = await response.json();

        // Retry logic: If 0 results and we are not on page 1, try page 1
        if ((!data.results || data.results.length === 0) && safePage !== 1) {
            console.log('[TMDB] 0 Results on page', safePage, '- Retrying Page 1');
            return fetchSouthIndianMovies(1, language);
        }

        console.log('[TMDB] Results:', data.results?.length);
        return data.results || [];
    } catch (error) {
        console.error('Error fetching movies:', error);
        return [];
    }
};

export const fetchMovieCredits = async (movieId: number): Promise<CastMember[]> => {
    if (!API_KEY) return [];
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`
        );
        const data = await response.json();
        return data.cast?.slice(0, 5) || []; // Return top 5 cast members
    } catch (error) {
        console.error('Error fetching credits:', error);
        return [];
    }
};

export const fetchSimilarMovies = async (movieId: number): Promise<Movie[]> => {
    if (!API_KEY) return [];
    try {
        const response = await fetch(
            `${BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();
        // Filter recommendations to ensure they are likely relevant or just return as is
        return data.results?.slice(0, 5) || [];
    } catch (error) {
        console.error('Error fetching similar movies:', error);
        return [];
    }
};

export const getImageUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Mock data for fallback
const MOCK_MOVIES: Movie[] = [
    {
        id: 1,
        title: "Baahubali: The Beginning",
        original_title: "Baahubali: The Beginning",
        overview: "The young Shivudu is left as a foundling in a small village by his mother. By the time he grows up, it becomes apparent that he possesses exceptional gifts. He meets the beautiful warrior/rebel Avantika with whom he falls in love. In trying to win her over, he learns about his past and his true legacy.",
        poster_path: "/9BAjt8nSSms62uOVyeS1j8FBbZu.jpg",
        backdrop_path: "/k1NUAe5tXJpM3Uo7cI5Uv2G9H0B.jpg",
        release_date: "2015-07-10",
        original_language: "te",
        genre_ids: [28, 12, 18],
        vote_average: 7.7
    },
    {
        id: 2,
        title: "RRR",
        original_title: "RRR",
        overview: "A fictional history of two legendary revolutionaries' journey away from home before they began fighting for their country in the 1920s.",
        poster_path: "/nEufeZlyAOLqO2brrs0yeF1lgXO.jpg",
        backdrop_path: "/s85WA0ccy1sP1Xbbf2jK1Gxg4zH.jpg",
        release_date: "2022-03-24",
        original_language: "te",
        genre_ids: [28, 18],
        vote_average: 7.8
    },
    {
        id: 3,
        title: "Vikram",
        original_title: "Vikram",
        overview: "Members of a black ops squad must track and eliminate a gang of masked murderers.",
        poster_path: "/bK535V4raiyMv44bJ6O4vN2iT5k.jpg",
        backdrop_path: "/5aC1a7r0f5v2r8Pb4K5v1a1J5v.jpg",
        release_date: "2022-06-03",
        original_language: "ta",
        genre_ids: [28, 53],
        vote_average: 7.9
    }
];
