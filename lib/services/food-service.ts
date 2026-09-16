// Service Layer with Strategy Pattern for Food Operations
import { FoodRepository, FoodItem } from '../repositories/food-repository';

// Helper to normalize restaurant_user which Supabase may return as array or object
function getRestaurantUser(food: FoodItem) {
  if (!food.restaurant_user) return null;
  return Array.isArray(food.restaurant_user) ? food.restaurant_user[0] : food.restaurant_user;
}

// Strategy Pattern for different food display strategies
export interface FoodDisplayStrategy {
  formatFoodData(foods: FoodItem[]): any[];
}

// Concrete Strategy for Grid Display
export class GridDisplayStrategy implements FoodDisplayStrategy {
  formatFoodData(foods: FoodItem[]): any[] {
    return foods.map(food => {
      const ru = getRestaurantUser(food);
      return {
        id: food.id,
        name: food.name,
        description: food.description,
        price: parseFloat(food.price.toString()),
        image_url: food.image_url,
        allergies: food.allergies,
        restaurant_name: ru?.name || 'Unknown Restaurant',
        restaurant_id: food.restaurant_id,
        restaurant_profile: ru?.profile_pic,
        ingredients: food.food_details || [],
        created_at: food.created_at
      };
    });
  }
}

// Concrete Strategy for List Display
export class ListDisplayStrategy implements FoodDisplayStrategy {
  formatFoodData(foods: FoodItem[]): any[] {
    return foods.map(food => {
      const ru = getRestaurantUser(food);
      return {
        id: food.id,
        name: food.name,
        price: parseFloat(food.price.toString()),
        restaurant_name: ru?.name || 'Unknown Restaurant',
        restaurant_id: food.restaurant_id,
        image_url: food.image_url,
        ingredient_count: food.food_details?.length || 0,
        created_at: food.created_at
      };
    });
  }
}

// Concrete Strategy for Search Results Display
export class SearchResultsDisplayStrategy implements FoodDisplayStrategy {
  formatFoodData(foods: FoodItem[]): any[] {
    return foods.map(food => {
      const ru = getRestaurantUser(food);
      return {
        id: food.id,
        name: food.name,
        description: food.description,
        price: parseFloat(food.price.toString()),
        image_url: food.image_url,
        restaurant_name: ru?.name || 'Unknown Restaurant',
        restaurant_id: food.restaurant_id,
        relevanceScore: 0 // Will be set by search algorithm
      };
    });
  }
}

// Context class for food display
export class FoodDisplayContext {
  private strategy: FoodDisplayStrategy;

  constructor(strategy: FoodDisplayStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: FoodDisplayStrategy): void {
    this.strategy = strategy;
  }

  formatFoods(foods: FoodItem[]): any[] {
    return this.strategy.formatFoodData(foods);
  }
}

// Main Food Service
export class FoodService {
  private repository: FoodRepository;
  private displayContext: FoodDisplayContext;

  constructor(repository: FoodRepository, displayStrategy: FoodDisplayStrategy) {
    this.repository = repository;
    this.displayContext = new FoodDisplayContext(displayStrategy);
  }

  async getAllFoods(): Promise<{ success: boolean; foods: any[]; error?: string }> {
    try {
      const { data, error } = await this.repository.getAllFoods();

      if (error) {
        console.error('Repository error:', error);
        return { success: false, foods: [], error: 'Failed to fetch foods' };
      }

      if (!data || data.length === 0) {
        return { success: true, foods: [], error: 'No foods found' };
      }

      const formattedFoods = this.displayContext.formatFoods(data);
      return { success: true, foods: formattedFoods };
    } catch (error) {
      console.error('Service error:', error);
      return { success: false, foods: [], error: 'Internal service error' };
    }
  }

  async getFoodsByRestaurant(restaurantId: number): Promise<{ success: boolean; foods: any[]; error?: string }> {
    try {
      const { data, error } = await this.repository.getFoodsByRestaurant(restaurantId);

      if (error) {
        console.error('Repository error:', error);
        return { success: false, foods: [], error: 'Failed to fetch restaurant foods' };
      }

      if (!data || data.length === 0) {
        return { success: true, foods: [], error: 'No foods found for this restaurant' };
      }

      const formattedFoods = this.displayContext.formatFoods(data);
      return { success: true, foods: formattedFoods };
    } catch (error) {
      console.error('Service error:', error);
      return { success: false, foods: [], error: 'Internal service error' };
    }
  }

  setDisplayStrategy(strategy: FoodDisplayStrategy): void {
    this.displayContext.setStrategy(strategy);
  }
}

// Factory for creating food services
export class FoodServiceFactory {
  static createGridDisplayService(repository: FoodRepository): FoodService {
    return new FoodService(repository, new GridDisplayStrategy());
  }

  static createListDisplayService(repository: FoodRepository): FoodService {
    return new FoodService(repository, new ListDisplayStrategy());
  }

  static createSearchResultsService(repository: FoodRepository): FoodService {
    return new FoodService(repository, new SearchResultsDisplayStrategy());
  }
}