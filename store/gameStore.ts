import { create } from 'zustand';
import { Movie } from '../types';

interface GameStore {
    score: number;
    lives: number;
    highScore: number;
    history: number[]; // IDs of guessed movies
    lastTargetMovie: Movie | null;

    // Actions
    incrementScore: () => void;
    decrementLives: () => void;
    resetGame: () => void;
    setLastTargetMovie: (movie: Movie) => void;
    addToHistory: (movieId: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
    score: 0,
    lives: 3,
    highScore: 0,
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
        history: [],
        lastTargetMovie: null
    }),

    addToHistory: (movieId) => set((state) => ({
        history: [...state.history, movieId]
    }))
}));
