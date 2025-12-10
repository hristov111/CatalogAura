
export interface Profile {
  id: number;
  name: string;
  age: number;
  city: string;
  imageUrl: string;
  interests: string[];
  bio: string;
  passions: string[];
  values: string[];
  gallery: string[];
  status: 'online' | 'offline';
  availability: 'Available for chat' | 'Busy';
  personalityLine: string;
  theme: {
    accent: string;
    accentRGB: string;
    bgStart: string;
    bgEnd: string;
    surfaceRGB: string;
    text: string;
    muted: string;
    btnBg: string;
    btnText: string;
    btnBorder: string;
    accentSoft: string;
  };
}
