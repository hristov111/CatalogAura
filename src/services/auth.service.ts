import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// TODO: Move to environment variables
const SUPABASE_URL = 'https://wgigbvraeojprbndnrmt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnaWdidnJhZW9qcHJibmRucm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjYwNzgsImV4cCI6MjA4MTMwMjA3OH0.ocoXoi_X_MVOIcA5fyp5jwYyl-yHmC7wb8tC9h1O0g4';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  readonly currentUser = signal<User | null>(null);
  readonly isGuest = signal<boolean>(false);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.init();
  }

  async init() {
    // Check for existing session
    const { data: { session } } = await this.supabase.auth.getSession();
    
    if (session?.user) {
      this.currentUser.set(session.user);
      this.isGuest.set(session.user.is_anonymous || false); // Supabase specific flag
    } else {
      // If no session, sign in anonymously immediately (The "Silent" Login)
      await this.signInAnonymously();
    }

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user || null);
      this.isGuest.set(session?.user?.is_anonymous || false);
    });
  }

  async signInAnonymously() {
    try {
      const { data, error } = await this.supabase.auth.signInAnonymously();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  }

  async convertToPermanentAccount(email: string, password: string) {
    try {
      // Update the anonymous user with email/password
      const { data, error } = await this.supabase.auth.updateUser({ 
        email, 
        password 
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error converting account:', error);
      throw error;
    }
  }

  async getToken(): Promise<string | null> {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session?.access_token || null;
  }
}

