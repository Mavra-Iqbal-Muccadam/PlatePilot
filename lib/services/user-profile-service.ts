'use client';

import { supabase } from '../supabase';

/**
 * Observer Pattern: Observers get notified when user profile changes
 */
interface UserProfileObserver {
  onProfileChanged(userId: number, profile: UserProfile): void;
}

/**
 * User Profile Data Model
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  profile_image?: string;
  age?: number;
  weight?: number;
  profession?: string;
  created_at?: string;
}

/**
 * Repository Pattern: Handles data access for user profiles
 */
interface UserProfileRepository {
  getUserProfile(userId: number): Promise<UserProfile | null>;
  updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<boolean>;
}

class SupabaseUserProfileRepository implements UserProfileRepository {
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    try {
      console.log(`[SupabaseUserProfileRepository] Fetching profile for userId: ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, profile_image, age, weight, profession, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SupabaseUserProfileRepository] Error fetching profile:', error);
        return null;
      }

      console.log('[SupabaseUserProfileRepository] Fetched profile:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('[SupabaseUserProfileRepository] Exception in getUserProfile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log(`[SupabaseUserProfileRepository] Updating profile for userId: ${userId}`, profile);
      
      const updateData: Record<string, any> = {};
      
      // Only include fields that are provided
      if (profile.username !== undefined) updateData.username = profile.username;
      if (profile.email !== undefined) updateData.email = profile.email;
      if (profile.profile_image !== undefined) updateData.profile_image = profile.profile_image;
      if (profile.age !== undefined) updateData.age = profile.age;
      if (profile.weight !== undefined) updateData.weight = profile.weight;
      if (profile.profession !== undefined) updateData.profession = profile.profession;

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('[SupabaseUserProfileRepository] Error updating profile:', error);
        return false;
      }

      console.log('[SupabaseUserProfileRepository] Successfully updated profile');
      return true;
    } catch (error) {
      console.error('[SupabaseUserProfileRepository] Exception in updateUserProfile:', error);
      return false;
    }
  }
}

/**
 * Factory Pattern: Creates repository instances
 */
class UserProfileRepositoryFactory {
  private static instance: UserProfileRepository;

  static getInstance(): UserProfileRepository {
    if (!this.instance) {
      this.instance = new SupabaseUserProfileRepository();
    }
    return this.instance;
  }
}

/**
 * Main User Profile Service with Observer Pattern
 */
export class UserProfileService {
  private repository: UserProfileRepository;
  private observers: Map<number, UserProfileObserver[]> = new Map();
  private profileCache: Map<number, UserProfile> = new Map();

  constructor(repository?: UserProfileRepository) {
    this.repository = repository || UserProfileRepositoryFactory.getInstance();
  }

  /**
   * Subscribe to profile changes for a user
   */
  subscribe(userId: number, observer: UserProfileObserver): void {
    console.log(`[UserProfileService] Subscribing observer for userId: ${userId}`);
    if (!this.observers.has(userId)) {
      this.observers.set(userId, []);
    }
    this.observers.get(userId)!.push(observer);
  }

  /**
   * Unsubscribe from profile changes
   */
  unsubscribe(userId: number, observer: UserProfileObserver): void {
    console.log(`[UserProfileService] Unsubscribing observer for userId: ${userId}`);
    const userObservers = this.observers.get(userId);
    if (userObservers) {
      const index = userObservers.indexOf(observer);
      if (index > -1) {
        userObservers.splice(index, 1);
      }
    }
  }

  /**
   * Notify all observers of profile change
   */
  private notifyObservers(userId: number, profile: UserProfile): void {
    console.log(`[UserProfileService] Notifying observers for userId: ${userId}`);
    const userObservers = this.observers.get(userId);
    if (userObservers) {
      userObservers.forEach(observer => {
        observer.onProfileChanged(userId, profile);
      });
    }
  }

  /**
   * Get user profile from cache or database
   */
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    console.log(`[UserProfileService] Getting profile for userId: ${userId}`);
    
    // Check in-memory cache first
    if (this.profileCache.has(userId)) {
      console.log(`[UserProfileService] Found in-memory cache for userId: ${userId}`);
      return this.profileCache.get(userId)!;
    }

    // Fetch from repository
    console.log(`[UserProfileService] Fetching from repository for userId: ${userId}`);
    const profile = await this.repository.getUserProfile(userId);
    
    if (profile) {
      // Cache the result
      this.profileCache.set(userId, profile);
      console.log(`[UserProfileService] Cached profile for userId: ${userId}`);
    }
    
    return profile;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: number, profile: Partial<UserProfile>): Promise<boolean> {
    console.log(`[UserProfileService] Updating profile for userId: ${userId}`, profile);
    
    // Update in repository
    const success = await this.repository.updateUserProfile(userId, profile);
    
    if (success) {
      // Get updated profile
      const updatedProfile = await this.repository.getUserProfile(userId);
      
      if (updatedProfile) {
        // Update cache
        this.profileCache.set(userId, updatedProfile);
        console.log(`[UserProfileService] Updated cache for userId: ${userId}`);
        
        // Notify observers
        this.notifyObservers(userId, updatedProfile);
        console.log(`[UserProfileService] Notified observers for userId: ${userId}`);
      }
    }
    
    return success;
  }

  /**
   * Get cached profile without fetching
   */
  getCachedProfile(userId: number): UserProfile | null {
    return this.profileCache.get(userId) || null;
  }

  /**
   * Clear cache for a user
   */
  clearCache(userId: number): void {
    console.log(`[UserProfileService] Clearing cache for userId: ${userId}`);
    this.profileCache.delete(userId);
  }
}

// Export factory for easy access
export const userProfileServiceFactory = UserProfileRepositoryFactory;
