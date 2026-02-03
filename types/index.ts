export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    original_language: string;
    genre_ids: number[];
    vote_average: number;
}

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface GameState {
    score: number;
    history: number[]; // IDs of movies already guessed
    currentMovie: Movie | null;
    isGameActive: boolean;
    lives: number;
}
