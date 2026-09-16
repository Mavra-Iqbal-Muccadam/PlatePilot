// Repository Pattern for Food Data Access
import { supabase } from '../supabase';

export interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  allergies?: string;
  enabled: boolean;
  restaurant_id: number;
  created_at: string;
  restaurant_user?: {
    id: number;
    name: string;
    email: string;
    profile_pic?: string;
  } | Array<{
    id: number;
    name: string;
    email: string;
    profile_pic?: string;
  }>;
  food_details?: Array<{
    id: number;
    ingredient_name: string;
    calories_count: number;
  }>;
}

export interface FoodRepository {
  getAllFoods(): Promise<{ data: FoodItem[] | null; error: any }>;
  getFoodsByRestaurant(restaurantId: number): Promise<{ data: FoodItem[] | null; error: any }>;
  getFoodById(id: number): Promise<{ data: FoodItem | null; error: any }>;
}

// Concrete Repository Implementation
export class SupabaseFoodRepository implements FoodRepository {
  async getAllFoods(): Promise<{ data: FoodItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          allergies,
          enabled,
          restaurant_id,
          created_at,
          restaurant_user (
            id,
            name,
            email,
            profile_pic
          ),
          food_details (
            id,
            ingredient_name,
            calories_count
          )
        `)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching all foods:', error);
      return { data: null, error };
    }
  }

  async getFoodsByRestaurant(restaurantId: number): Promise<{ data: FoodItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          allergies,
          enabled,
          restaurant_id,
          created_at,
          restaurant_user (
            id,
            name,
            email,
            profile_pic
          ),
          food_details (
            id,
            ingredient_name,
            calories_count
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error fetching foods by restaurant:', error);
      return { data: null, error };
    }
  }

  async getFoodById(id: number): Promise<{ data: FoodItem | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          allergies,
          enabled,
          restaurant_id,
          created_at,
          restaurant_user (
            id,
            name,
            email,
            profile_pic
          ),
          food_details (
            id,
            ingredient_name,
            calories_count
          )
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching food by id:', error);
      return { data: null, error };
    }
  }
}

// Factory for creating repository instances
export class FoodRepositoryFactory {
  static createSupabaseRepository(): SupabaseFoodRepository {
    return new SupabaseFoodRepository();
  }
}