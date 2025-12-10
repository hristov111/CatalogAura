
export interface Profile {
  id: number;
  name: string;
  age: number;
  city: string;
  imageUrl: string;
  interests: string[];
  bio: string;
  extendedBio?: string; // More detailed biography for hero section
  passions: string[];
  values: string[];
  gallery: string[];
  status: 'online' | 'offline';
  availability: 'Available for chat' | 'Busy';
  personalityLine: string;
  testimonials?: string[]; // Social proof testimonials
  specialOffer?: string; // Special CTA offer
  responseTime?: string; // Average response time
  verified?: boolean; // Verification badge
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
