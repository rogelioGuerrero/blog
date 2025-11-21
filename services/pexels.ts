
const PEXELS_API_KEY = 'cn1L5H2haPcdyVqVVQHSiHv7cESwnxIbnFW5cTFes6BHwXjqcwqi0t4E';
const BASE_URL = 'https://api.pexels.com/v1';
const VIDEO_BASE_URL = 'https://api.pexels.com/videos';

interface PexelsPhoto {
  src: {
    large2x: string; // High quality for retina
    large: string;
    landscape: string;
  };
  photographer: string;
}

interface PexelsVideo {
  video_files: {
    link: string;
    quality: string; // 'hd', 'sd'
    width: number;
  }[];
  user: {
    name: string;
  };
  image: string; // Thumbnail
}

export const searchMedia = async (query: string, type: 'image' | 'video'): Promise<{ src: string; caption: string } | null> => {
  try {
    const headers = {
      Authorization: PEXELS_API_KEY,
    };

    const endpoint = type === 'video' 
      ? `${VIDEO_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`
      : `${BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

    const response = await fetch(endpoint, { headers });
    const data = await response.json();

    if (type === 'image') {
      const photos = data.photos as PexelsPhoto[];
      if (photos.length > 0) {
        return {
          src: photos[0].src.large2x || photos[0].src.large,
          caption: `Photo by ${photos[0].photographer} on Pexels`
        };
      }
    } else {
      const videos = data.videos as PexelsVideo[];
      if (videos.length > 0) {
        // Try to find an HD video, fallback to first available
        const videoFile = videos[0].video_files.find(v => v.quality === 'hd') || videos[0].video_files[0];
        return {
          src: videoFile.link,
          caption: `Video by ${videos[0].user.name} on Pexels`
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error fetching from Pexels:", error);
    return null;
  }
};
