import { supabase } from '../supabase';

/**
 * Strategy Pattern: Different calorie calculation strategies
 */
interface CalorieCalculationStrategy {
  calculate(data: any): Promise<number>;
}

/**
 * Strategy 1: Calculate calories from food table (direct total_calories)
 */
class DirectFoodCalorieStrategy implements CalorieCalculationStrategy {
  async calculate(foodId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('food')
        .select('total_calories')
        .eq('id', foodId)
        .single();

      if (error || !data) {
        console.error('Error fetching food calories:', error);
        return 0;
      }

      return Number(data.total_calories) || 0;
    } catch (error) {
      console.error('Error in DirectFoodCalorieStrategy:', error);
      return 0;
    }
  }
}

/**
 * Strategy 2: Calculate calories from food_details (sum of ingredients)
 */
class DetailedFoodCalorieStrategy implements CalorieCalculationStrategy {
  async calculate(foodId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('food_details')
        .select('calories_count')
        .eq('food_id', foodId);

      if (error) {
        console.error('Error fetching food details:', error);
        return 0;
      }

      if (!data || data.length === 0) {
        return 0;
      }

      return data.reduce((sum, detail) => sum + (Number(detail.calories_count) || 0), 0);
    } catch (error) {
      console.error('Error in DetailedFoodCalorieStrategy:', error);
      return 0;
    }
  }
}

/**
 * Repository Pattern: Handles data access for calorie calculations
 */
interface CalorieRepository {
  getFoodCalories(foodId: number): Promise<number>;
  getDealCalories(dealId: number): Promise<number>;
  getDealItemsCalories(dealId: number): Promise<number>;
}

class SupabaseCalorieRepository implements CalorieRepository {
  private directStrategy: CalorieCalculationStrategy;
  private detailedStrategy: CalorieCalculationStrategy;

  constructor() {
    this.directStrategy = new DirectFoodCalorieStrategy();
    this.detailedStrategy = new DetailedFoodCalorieStrategy();
  }

  /**
   * Get calories for a single food item
   * Tries direct calories first, falls back to detailed calculation
   */
  async getFoodCalories(foodId: number): Promise<number> {
    const directCalories = await this.directStrategy.calculate(foodId);
    
    // If direct calories exist and are > 0, use them
    if (directCalories > 0) {
      return directCalories;
    }

    // Otherwise, calculate from food_details
    const detailedCalories = await this.detailedStrategy.calculate(foodId);
    return detailedCalories;
  }

  /**
   * Get total calories for a deal by summing all food items in the deal
   */
  async getDealCalories(dealId: number): Promise<number> {
    try {
      // Fetch deal items
      const { data: dealItems, error: dealError } = await supabase
        .from('deal_items')
        .select('food_id, quantity')
        .eq('deal_id', dealId);

      if (dealError || !dealItems || dealItems.length === 0) {
        console.error('Error fetching deal items:', dealError);
        return 0;
      }

      // Calculate total calories for all items in the deal
      let totalCalories = 0;
      for (const item of dealItems) {
        const foodCalories = await this.getFoodCalories(item.food_id);
        totalCalories += foodCalories * (item.quantity || 1);
      }

      return totalCalories;
    } catch (error) {
      console.error('Error in getDealCalories:', error);
      return 0;
    }
  }

  /**
   * Alias for getDealCalories for consistency
   */
  async getDealItemsCalories(dealId: number): Promise<number> {
    return this.getDealCalories(dealId);
  }
}

/**
 * Factory Pattern: Creates repository instances
 */
class CalorieRepositoryFactory {
  private static instance: CalorieRepository;

  static getInstance(): CalorieRepository {
    if (!this.instance) {
      this.instance = new SupabaseCalorieRepository();
    }
    return this.instance;
  }
}

/**
 * Service: High-level calorie calculation service
 */
export class CalorieCalculatorService {
  private repository: CalorieRepository;

  constructor(repository?: CalorieRepository) {
    this.repository = repository || CalorieRepositoryFactory.getInstance();
  }

  /**
   * Calculate calories for a food item
   */
  async calculateFoodCalories(foodId: number): Promise<number> {
    return this.repository.getFoodCalories(foodId);
  }

  /**
   * Calculate total calories for a deal
   */
  async calculateDealCalories(dealId: number): Promise<number> {
    return this.repository.getDealCalories(dealId);
  }

  /**
   * Calculate calories for multiple items
   */
  async calculateMultipleItemsCalories(
    items: Array<{ id: number; type: 'food' | 'deal'; quantity: number }>
  ): Promise<number> {
    let totalCalories = 0;

    for (const item of items) {
      let itemCalories = 0;
      if (item.type === 'food') {
        itemCalories = await this.calculateFoodCalories(item.id);
      } else if (item.type === 'deal') {
        itemCalories = await this.calculateDealCalories(item.id);
      }
      totalCalories += itemCalories * (item.quantity || 1);
    }

    return totalCalories;
  }
}

// Export factory for easy access
export const calorieCalculatorFactory = CalorieRepositoryFactory;
