import { supabase } from '../supabase';

// Repository Pattern Implementation for Food Items

export interface Food {
  id?: number;
  restaurant_id: number;
  name: string;
  allergies?: string;
  image_url?: string;
  price: number;
  description?: string;
  created_at?: string;
}

export interface FoodDetail {
  id?: number;
  food_id: number;
  ingredient_name: string;
  calories_count: number;
  created_at?: string;
}

export interface FoodRepository {
  create(food: Omit<Food, 'id' | 'created_at'>): Promise<Food | null>;
  findById(id: number): Promise<Food | null>;
  findByRestaurantId(restaurantId: number): Promise<Food[]>;
  uploadImage(file: File, restaurantId: number): Promise<string | null>;
}

export interface FoodDetailRepository {
  createMultiple(foodDetails: Omit<FoodDetail, 'id' | 'created_at'>[]): Promise<FoodDetail[]>;
  findByFoodId(foodId: number): Promise<FoodDetail[]>;
}

export class SupabaseFoodRepository implements FoodRepository {
  
  async create(food: Omit<Food, 'id' | 'created_at'>): Promise<Food | null> {
    try {
      console.log('Creating food record...');
      const { data, error } = await supabase
        .from('food')
        .insert([{
          restaurant_id: food.restaurant_id,
          name: food.name,
          allergies: food.allergies,
          image_url: food.image_url,
          price: food.price,
          description: food.description
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating food item:', error);
        return null;
      }

      console.log('Food record created successfully:', data);
      return data as Food;
    } catch (error) {
      console.error('Error in create food item:', error);
      return null;
    }
  }

  async findById(id: number): Promise<Food | null> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding food item by id:', error);
        return null;
      }

      return data as Food;
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findByRestaurantId(restaurantId: number): Promise<Food[]> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding food items by restaurant id:', error);
        return [];
      }

      return data as Food[];
    } catch (error) {
      console.error('Error in findByRestaurantId:', error);
      return [];
    }
  }

  async uploadImage(file: File, restaurantId: number): Promise<string | null> {
    try {
      console.log('Starting image upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        restaurantId
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

      console.log('Uploading to bucket "food-pic" with path:', fileName);

      const { data, error } = await supabase.storage
        .from('food-pic')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return null;
      }

      console.log('Upload successful, data:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('food-pic')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      return null;
    }
  }
}

export class SupabaseFoodDetailRepository implements FoodDetailRepository {
  
  async createMultiple(foodDetails: Omit<FoodDetail, 'id' | 'created_at'>[]): Promise<FoodDetail[]> {
    try {
      console.log('Creating food details...');
      const { data, error } = await supabase
        .from('food_details')
        .insert(foodDetails)
        .select();

      if (error) {
        console.error('Error creating food details:', error);
        return [];
      }

      console.log('Food details created successfully:', data?.length);
      return data as FoodDetail[];
    } catch (error) {
      console.error('Error in createMultiple food details:', error);
      return [];
    }
  }

  async findByFoodId(foodId: number): Promise<FoodDetail[]> {
    try {
      const { data, error } = await supabase
        .from('food_details')
        .select('*')
        .eq('food_id', foodId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error finding food details by food id:', error);
        return [];
      }

      return data as FoodDetail[];
    } catch (error) {
      console.error('Error in findByFoodId:', error);
      return [];
    }
  }
}