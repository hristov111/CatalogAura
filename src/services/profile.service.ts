import { Injectable, computed, signal, inject } from '@angular/core';
import { Profile } from '../profile.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private supabaseService = inject(SupabaseService);
  
  readonly profiles = signal<Profile[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadProfiles();
  }

  async loadProfiles(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const { data, error } = await this.supabaseService.client
        .from('personas')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching personas:', error);
        this.error.set(`Database error: ${error.message}`);
        this.profiles.set([]);
      } else if (data && data.length > 0) {
        // Transform database format to Profile format
        const profiles: Profile[] = data.map(persona => ({
          id: persona.id,
          name: persona.name,
          age: persona.age,
          city: persona.city,
          imageUrl: persona.image_url,
          interests: persona.interests || [],
          bio: persona.bio || '',
          extendedBio: persona.extended_bio,
          passions: persona.passions || [],
          values: persona.values || [],
          gallery: persona.gallery || [],
          status: persona.status as 'online' | 'offline',
          availability: persona.availability as 'Available for chat' | 'Busy',
          personalityLine: persona.personality_line || '',
          testimonials: persona.testimonials || [],
          specialOffer: persona.special_offer,
          responseTime: persona.response_time,
          verified: persona.verified || false,
          theme: persona.theme || {}
        }));

        this.profiles.set(profiles);
      } else {
        // No data in database
        this.error.set('No personas found in database. Please run the migration scripts.');
        this.profiles.set([]);
      }
    } catch (err) {
      console.error('Unexpected error loading profiles:', err);
      this.error.set('Failed to connect to database. Check your Supabase configuration.');
      this.profiles.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  getProfileById(id: number): Profile | undefined {
    return this.profiles().find(p => p.id === id);
  }

  async refreshProfiles(): Promise<void> {
    await this.loadProfiles();
  }
}
