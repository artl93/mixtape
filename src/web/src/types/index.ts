export interface Track {
  id: number;
  title: string;
  file_url: string;
  id3?: {
    artist?: string | null;
    album?: string | null;
    year?: number | null;
    genre?: string | null;
    duration?: number | null;
    track?: number | null;
    title?: string | null;
  };
}

export interface User {
  id: number;
  google_id: string;
  email: string;
  display_name: string;
  profile_picture: string | null;
}

export interface EditFields {
  title: string;
  artist: string;
  album: string;
  track: string | number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
