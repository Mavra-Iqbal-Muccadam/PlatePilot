'use client';

import { supabase } from '../supabase';

/**
 * Observer Pattern: Observers get notified when allergies change
 */
interface AllergiesObserver {
  onAllergiesChanged(userId: number, allergies: string[]): void;
}

/**
 * Repository Pattern: Handles data access for allergies
 */
interface AllergiesRepository {
  getUserAllergies(userId: number): Promise<string[]>;
  updateUserAllergies(userId: number, allergies: string[]): Promise<boolean>;
}

class SupabaseAllergiesRepository implements AllergiesRepository {
  async getUserAllergies(userId: number): Promise<string[]> {
    try {
      console.log(`[SupabaseAllergiesRepository] Fetching allergies for userId: ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('allergies')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[SupabaseAllergiesRepository] Error fetching allergies:', error);
        return [];
      }

      const allergies = data?.allergies || [];
      console.log('[SupabaseAllergiesRepository] Fetched allergies:', allergies);
      return allergies;
    } catch (error) {
      console.error('[SupabaseAllergiesRepository] Exception in getUserAllergies:', error);
      return [];
    }
  }

  async updateUserAllergies(userId: number, allergies: string[]): Promise<boolean> {
    try {
      console.log(`[SupabaseAllergiesRepository] Updating allergies for userId: ${userId}`, allergies);
      
      const { error } = await supabase
        .from('users')
        .update({ allergies })
        .eq('id', userId);

      if (error) {
        console.error('[SupabaseAllergiesRepository] Error updating allergies:', error);
        return false;
      }

      console.log('[SupabaseAllergiesRepository] Successfully updated allergies');
      return true;
    } catch (error) {
      console.error('[SupabaseAllergiesRepository] Exception in updateUserAllergies:', error);
      return false;
    }
  }
}

/**
 * Factory Pattern: Creates repository instances
 */
class AllergiesRepositoryFactory {
  private static instance: AllergiesRepository;

  static getInstance(): AllergiesRepository {
    if (!this.instance) {
      this.instance = new SupabaseAllergiesRepository();
    }
    return this.instance;
  }
}

/**
 * Main Allergies Service with Observer Pattern
 */
export class AllergiesService {
  private repository: AllergiesRepository;
  private observers: Map<number, AllergiesObserver[]> = new Map();
  private allergiesCache: Map<number, string[]> = new Map();

  constructor(repository?: AllergiesRepository) {
    this.repository = repository || AllergiesRepositoryFactory.getInstance();
  }

  /**
   * Subscribe to allergies changes for a user
   */
  subscribe(userId: number, observer: AllergiesObserver): void {
    console.log(`[AllergiesService] Subscribing observer for userId: ${userId}`);
    if (!this.observers.has(userId)) {
      this.observers.set(userId, []);
    }
    this.observers.get(userId)!.push(observer);
  }

  /**
   * Unsubscribe from allergies changes
   */
  unsubscribe(userId: number, observer: AllergiesObserver): void {
    console.log(`[AllergiesService] Unsubscribing observer for userId: ${userId}`);
    const userObservers = this.observers.get(userId);
    if (userObservers) {
      const index = userObservers.indexOf(observer);
      if (index > -1) {
        userObservers.splice(index, 1);
      }
    }
  }

  /**
   * Notify all observers of allergies change
   */
  private notifyObservers(userId: number, allergies: string[]): void {
    console.log(`[AllergiesService] Notifying observers for userId: ${userId}`);
    const userObservers = this.observers.get(userId);
    if (userObservers) {
      userObservers.forEach(observer => {
        observer.onAllergiesChanged(userId, allergies);
      });
    }
  }

  /**
   * Get user allergies from cache or database
   */
  async getUserAllergies(userId: number): Promise<string[]> {
    console.log(`[AllergiesService] Getting allergies for userId: ${userId}`);
    
    // Check in-memory cache first
    if (this.allergiesCache.has(userId)) {
      console.log(`[AllergiesService] Found in-memory cache for userId: ${userId}`);
      return this.allergiesCache.get(userId)!;
    }

    // Fetch from repository
    console.log(`[AllergiesService] Fetching from repository for userId: ${userId}`);
    const allergies = await this.repository.getUserAllergies(userId);
    
    // Cache the result
    this.allergiesCache.set(userId, allergies);
    console.log(`[AllergiesService] Cached allergies for userId: ${userId}`);
    
    return allergies;
  }

  /**
   * Update user allergies
   */
  async updateUserAllergies(userId: number, allergies: string[]): Promise<boolean> {
    console.log(`[AllergiesService] Updating allergies for userId: ${userId}`, allergies);
    
    // Update in repository
    const success = await this.repository.updateUserAllergies(userId, allergies);
    
    if (success) {
      // Update cache
      this.allergiesCache.set(userId, allergies);
      console.log(`[AllergiesService] Updated cache for userId: ${userId}`);
      
      // Notify observers
      this.notifyObservers(userId, allergies);
      console.log(`[AllergiesService] Notified observers for userId: ${userId}`);
    }
    
    return success;
  }

  /**
   * Add an allergy to user's list
   */
  async addAllergy(userId: number, allergy: string): Promise<boolean> {
    console.log(`[AllergiesService] Adding allergy "${allergy}" for userId: ${userId}`);
    
    const currentAllergies = await this.getUserAllergies(userId);
    
    if (!currentAllergies.includes(allergy)) {
      const updatedAllergies = [...currentAllergies, allergy];
      return this.updateUserAllergies(userId, updatedAllergies);
    }
    
    console.log(`[AllergiesService] Allergy "${allergy}" already exists for userId: ${userId}`);
    return true;
  }

  /**
   * Remove an allergy from user's list
   */
  async removeAllergy(userId: number, allergy: string): Promise<boolean> {
    console.log(`[AllergiesService] Removing allergy "${allergy}" for userId: ${userId}`);
    
    const currentAllergies = await this.getUserAllergies(userId);
    const updatedAllergies = currentAllergies.filter(a => a !== allergy);
    
    return this.updateUserAllergies(userId, updatedAllergies);
  }

  /**
   * Clear all allergies for a user
   */
  async clearAllergies(userId: number): Promise<boolean> {
    console.log(`[AllergiesService] Clearing all allergies for userId: ${userId}`);
    return this.updateUserAllergies(userId, []);
  }

  /**
   * Get cached allergies without fetching
   */
  getCachedAllergies(userId: number): string[] | null {
    return this.allergiesCache.get(userId) || null;
  }
}

// Export factory for easy access
export const allergiesServiceFactory = AllergiesRepositoryFactory;
