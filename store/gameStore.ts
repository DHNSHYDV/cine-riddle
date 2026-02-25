import { create } from 'zustand';
import { Movie } from '../types';

interface GameStore {
    score: number;
    lives: number;
    highScore: number;
    history: number[]; // IDs of guessed movies
    lastTargetMovie: Movie | null;
    playedTracks: string[];
    visitedPages: Record<string, number[]>;

    // Actions
    incrementScore: () => void;
    decrementLives: () => void;
    resetGame: () => void;
    setLastTargetMovie: (movie: Movie) => void;
    addToHistory: (movieId: number) => void;
    addPlayedTrack: (title: string) => void;
    markPageVisited: (lang: string, page: number) => void;
    getUnvisitedRandomPage: (lang: string, maxPages: number) => number;
    isElite: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
    score: 0,
    lives: 3,
    highScore: 0, // In-session high score
    history: [],
    lastTargetMovie: null,

    incrementScore: () => set((state) => ({
        score: state.score + 1,
        highScore: Math.max(state.score + 1, state.highScore)
    })),

    decrementLives: () => set((state) => ({
        lives: Math.max(0, state.lives - 1)
    })),

    setLastTargetMovie: (movie) => set({ lastTargetMovie: movie }),

    resetGame: () => set({
        score: 0,
        lives: 3,
        // history: [], // We keep history across games in the same session to prevent repeats!
        lastTargetMovie: null
    }),

    addToHistory: (movieId) => set((state) => ({
        history: [...state.history, movieId].slice(-500) // Keep last 500 to prevent repeats but save memory
    })),

    playedTracks: [],
    addPlayedTrack: (title) => set((state) => ({
        playedTracks: [...state.playedTracks, title]
    })),

    isElite: () => {
        const state = get();
        return state.score >= 100 || state.highScore >= 100;
    },

    // New: Visited Pages Logic
    visitedPages: { 'telugu': [], 'tamil': [], 'malayalam': [], 'all': [] },

    markPageVisited: (lang, page) => set((state) => {
        const key = lang || 'all';
        const pages = state.visitedPages[key] || [];
        if (pages.includes(page)) return state;
        return {
            visitedPages: {
                ...state.visitedPages,
                [key]: [...pages, page]
            }
        };
    }),

    getUnvisitedRandomPage: (lang, maxPages) => {
        const state = get();
        const key = lang || 'all';
        const visited = state.visitedPages[key] || [];

        // Create array of all possible pages [1...maxPages]
        // We start from 1 up to maxPages
        // We filter out visited ones

        // Optimization: If we visited too many, just pick random and hope for best (or reset?)
        // Let's try to find a random unvisited one.

        let attempts = 0;
        let randomPage = Math.floor(Math.random() * maxPages) + 1;

        while (visited.includes(randomPage) && attempts < 50) {
            randomPage = Math.floor(Math.random() * maxPages) + 1;
            attempts++;
        }

        return randomPage;
    }
}));
