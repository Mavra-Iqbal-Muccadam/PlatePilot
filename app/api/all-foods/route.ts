import { NextRequest, NextResponse } from 'next/server';

// Repository Pattern for data access
interface FoodRepository {
  getAllFoods(): Promise<any[]>;
}

class SupabaseFoodRepository implements FoodRepository {
  async getAllFoods(): Promise<any[]> {
    const { supabase } = await import('../../../lib/supabase');
    
    const { data: foods, error } = await supabase
      .from('food')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        allergies,
        enabled,
        created_at,
        restaurant_user (
          id,
          name,
          profile_pic
        ),
        food_details (
          ingredient_name,
          calories_count
        )
      `)
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return foods || [];
  }
}

// Strategy Pattern for food filtering
interface FoodFilterStrategy {
  filter(foods: any[], criteria?: any): any[];
}

class AllFoodsFilterStrategy implements FoodFilterStrategy {
  filter(foods: any[]): any[] {
    // Return all enabled foods (no additional filtering)
    return foods;
  }
}

class RestaurantFilterStrategy implements FoodFilterStrategy {
  filter(foods: any[], restaurantId: number): any[] {
    return foods.filter(food => food.restaurant_user?.id === restaurantId);
  }
}

class PriceRangeFilterStrategy implements FoodFilterStrategy {
  filter(foods: any[], priceRange: { min: number; max: number }): any[] {
    return foods.filter(food => {
      const price = parseFloat(food.price.toString());
      return price >= priceRange.min && price <= priceRange.max;
    });
  }
}

// Factory Pattern for creating filter strategies
class FilterStrategyFactory {
  static createAllFoodsFilter(): AllFoodsFilterStrategy {
    return new AllFoodsFilterStrategy();
  }

  static createRestaurantFilter(): RestaurantFilterStrategy {
    return new RestaurantFilterStrategy();
  }

  static createPriceRangeFilter(): PriceRangeFilterStrategy {
    return new PriceRangeFilterStrategy();
  }
}

// Service Layer using Repository and Strategy patterns
class FoodService {
  constructor(
    private foodRepository: FoodRepository,
    private filterStrategy: FoodFilterStrategy
  ) {}

  async getAllFoods(filterCriteria?: any): Promise<any[]> {
    try {
      const foods = await this.foodRepository.getAllFoods();
      const filteredFoods = this.filterStrategy.filter(foods, filterCriteria);
      
      // Transform data for consistent API response
      return filteredFoods.map(food => ({
        id: food.id,
        name: food.name,
        description: food.description || '',
        price: parseFloat(food.price.toString()),
        image_url: food.image_url,
        allergies: food.allergies || '',
        created_at: food.created_at,
        restaurant: {
          id: food.restaurant_user?.id || 0,
          name: food.restaurant_user?.name || 'Unknown Restaurant',
          profile_pic: food.restaurant_user?.profile_pic
        },
        ingredients: food.food_details?.map((detail: any) => ({
          name: detail.ingredient_name,
          calories: detail.calories_count || 0
        })) || [],
        total_calories: food.food_details?.reduce((sum: number, detail: any) => 
          sum + (detail.calories_count || 0), 0) || 0
      }));
    } catch (error) {
      console.error('Error in FoodService.getAllFoods:', error);
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const restaurantId = url.searchParams.get('restaurant_id');
    const minPrice = url.searchParams.get('min_price');
    const maxPrice = url.searchParams.get('max_price');

    // Use Repository Pattern
    const foodRepository = new SupabaseFoodRepository();
    
    // Use Strategy Pattern based on query parameters
    let filterStrategy: FoodFilterStrategy;
    let filterCriteria: any = undefined;

    if (restaurantId) {
      filterStrategy = FilterStrategyFactory.createRestaurantFilter();
      filterCriteria = parseInt(restaurantId);
    } else if (minPrice && maxPrice) {
      filterStrategy = FilterStrategyFactory.createPriceRangeFilter();
      filterCriteria = {
        min: parseFloat(minPrice),
        max: parseFloat(maxPrice)
      };
    } else {
      filterStrategy = FilterStrategyFactory.createAllFoodsFilter();
    }

    // Use Service Layer
    const foodService = new FoodService(foodRepository, filterStrategy);
    const foods = await foodService.getAllFoods(filterCriteria);

    return NextResponse.json({
      success: true,
      foods: foods,
      total: foods.length,
      filters_applied: {
        restaurant_id: restaurantId,
        price_range: minPrice && maxPrice ? { min: minPrice, max: maxPrice } : null
      }
    });

  } catch (error) {
    console.error('Error in all-foods API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch foods: ' + errorMessage,
        foods: [],
        total: 0
      },
      { status: 500 }
    );
  }
}