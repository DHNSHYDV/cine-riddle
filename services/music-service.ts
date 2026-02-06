
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
            let movieName = track.collectionName;

            // Pattern: Song Name (From "Movie Name") or [From "Movie Name"]
            const fromMatch = movieName.match(/[(\[]From\s+"([^"\]]+)"[)\]]/i) ||
                movieName.match(/[(\[]From\s+([^)\]]+)[)\]]/i);

            if (fromMatch) {
                movieName = fromMatch[1];
            }

            const cleanMovie = movieName
                .replace(/\s*\(Original Motion Picture Soundtrack\)/gi, '')
                .replace(/\s*\(Soundtrack\)/gi, '')
                .replace(/\s*-\s*EP\s*$/gi, '')
                .replace(/\s*-\s*Single\s*$/gi, '')
                .replace(/\s*- OST$/gi, '')
                .replace(/\s*\(Deluxe\)/gi, '')
                .replace(/\s*\[Live\]/gi, '')
                .replace(/\s*\(feat\..*?\)/gi, '') // Remove (feat. Author)
                .replace(/\s*\[feat\..*?\]/gi, '') // Remove [feat. Author]
                .replace(/\s*Part\s*\d+/gi, '') // Remove Part 1, Part 2 etc
                .replace(/\s*\(\d{4}\)$/gi, '') // Remove year like (2024)
                .trim();

            return {
                title: track.trackName,
                artist: track.artistName,
                movie: cleanMovie,
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

/**
 * Tighter Regional Search
 * Appends language to ensure regional version if multiple exist
 */
export async function getMysteryAudioWithLang(title: string, language: string): Promise<AudioTrack | null> {
    const query = `${title} ${language} movie songs`;
    return getMysteryAudio(query);
}


export const regionalPlaylists = {
    telugu: [
        'Pushpa 2', 'Devara', 'Guntur Kaaram', 'Salaar', 'RRR', 'Baahubali', 'Ala Vaikunthapurramuloo',
        'Jersey', 'Arjun Reddy', 'Kalki 2898 AD', 'Maharshi', 'Sarileru Neekevvaru', 'Rangasthalam',
        'Magadheera', 'Eega', 'Bommarillu', 'Happy Days', 'Athadu', 'Pokiri', 'Jalsa', 'Gabbar Singh',
        'Attarintiki Daredi', 'Srimanthudu', 'Janatha Garage', 'Bharat Ane Nenu', 'Fidaa',
        'Geetha Govindam', 'Agent Sai Srinivasa Athreya', 'Mathu Vadalara', 'DJ Tillu', 'Major',
        'Sita Ramam', 'Hanu-Man', 'Hi Nanna', 'Dasara', 'Waltair Veerayya', 'Baby (Telugu)', 'Pelli Choopulu'
    ],
    tamil: [
        'Leo', 'Jailer', 'Vikram', 'Master', 'Ponniyin Selvan', '96', 'Kaithi', 'Thiruchitrambalam',
        'Vada Chennai', 'Asuran', 'Thunivu', 'Varisu', 'Bigil', 'Petta', 'Mersal', 'Kabali', 'Enthiran',
        'Sivaji', 'Ghilli', 'Pokkiri', 'Anniyan', 'Pudhupettai', 'Polladhavan', 'Aadukalam', 'Jigarthanda',
        'Soodhu Kavvum', 'Vikram Vedha', 'Pariyerum Perumal', 'Jai Bhim', 'Gargi', 'Viduthalai', 'Maaveeran',
        'Maanagaram', 'Velaiilla Pattadhari', 'Mankatha'
    ],
    malayalam: [
        'Manjummel Boys', 'Aavesham', 'Premalu', 'Bramayugam', 'Lucifer', 'Kumbalangi Nights',
        'Hridayam', 'Minnal Murali', 'Thallumaala', 'Drishyam', 'Bangalore Days', 'Premam', 'Charlie',
        'Moothon', 'Jallikattu', 'Angamaly Diaries', 'Virus', 'Trance', 'Malik', 'Kurup',
        'Bheeshma Parvam', 'Nanpakal Nerathu Mayakkam', '2018 Movie', 'Neru', 'Falimy', 'Adi Kapyare Kootamani',
        'Ayyappanum Koshiyum', 'Ustad Hotel'
    ]
};

export const getRandomMovieForLanguage = (lang: string) => {
    const key = lang.toLowerCase();
    let list: string[] = [];

    if (key === 'all') {
        // Merge the three pillars for the "All" mystery pool
        list = [
            ...regionalPlaylists.telugu,
            ...regionalPlaylists.tamil,
            ...regionalPlaylists.malayalam
        ];
    } else {
        list = (regionalPlaylists as any)[key] || regionalPlaylists.telugu;
    }

    const movie = list[Math.floor(Math.random() * list.length)];
    // Return both movie and lang for stricter search
    return { movie, searchTag: lang === 'all' ? '' : lang };
};
