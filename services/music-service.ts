

// --- Types ---
export interface AudioTrack {
    title: string;
    artist: string;
    movie: string; // Album name often = Movie name in India
    previewUrl: string;
    artworkUrl: string;
    source: 'spotify' | 'itunes';
}

const ITUNES_API_URL = 'https://itunes.apple.com/search';

/**
 * Fallback to iTunes API
 * Very reliable for Regional Indian Cinema (Telugu, Tamil, Malayalam)
 */
async function searchItunes(query: string): Promise<AudioTrack | null> {
    try {
        // Search for "Music" (Song)
        const response = await fetch(`${ITUNES_API_URL}?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`);
        const data = await response.json();

        if (data.resultCount > 0) {
            const track = data.results[0];
            return {
                title: track.trackName,
                artist: track.artistName,
                movie: track.collectionName, // In iTunes, collectionName is album/movie
                previewUrl: track.previewUrl,
                artworkUrl: track.artworkUrl100.replace('100x100', '600x600'), // Get high res
                source: 'itunes'
            };
        }
    } catch (error) {
        console.error("iTunes Search Error:", error);
    }
    return null;
}

/**
 * Main Service Function
 * Currently defaults to iTunes as primary (easiest, no auth needed)
 * Will add Spotify later if needed.
 */
export async function getMysteryAudio(searchQuery: string): Promise<AudioTrack | null> {
    console.log(`[MusicService] Searching for: ${searchQuery}`);

    // 1. Try iTunes (Great coverage for Indian OSTs)
    const itunesResult = await searchItunes(searchQuery);
    if (itunesResult && itunesResult.previewUrl) {
        return itunesResult;
    }

    return null;
}


export const regionalPlaylists = {
    telugu: ['Pushpa 2', 'Devara', 'Guntur Kaaram', 'Salaar', 'RRR', 'Baahubali', 'Ala Vaikunthapurramuloo', 'Jersey', 'Arjun Reddy', 'Kalki 2898 AD'],
    tamil: ['Leo', 'Jailer', 'Vikram', 'Master', 'Ponniyin Selvan', '96', 'Kaithi', 'Thiruchitrambalam', 'Vada Chennai', 'Asuran'],
    malayalam: ['Manjummel Boys', 'Aavesham', 'Premalu', 'Bramayugam', 'Lucifer', 'Kumbalangi Nights', 'Hridayam', 'Minnal Murali', 'Thallumaala'],
    hindi: ['Jawan', 'Pathaan', 'Animal', 'Rocky Aur Rani', 'War', 'Kabir Singh', 'Yeh Jawaani Hai Deewani', '3 Idiots']
};

export const getRandomMovieForLanguage = (lang: string) => {
    // @ts-ignore
    const list = regionalPlaylists[lang] || regionalPlaylists['telugu'];
    return list[Math.floor(Math.random() * list.length)];
};
