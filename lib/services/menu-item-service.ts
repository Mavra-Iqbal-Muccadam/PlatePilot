import { Food, FoodDetail, SupabaseFoodRepository, SupabaseFoodDetailRepository } from '../repositories/menu-item-repository';

// Unit of Work Pattern Implementation

export class FoodUnitOfWork {
  private foodRepository: SupabaseFoodRepository;
  private foodDetailRepository: SupabaseFoodDetailRepository;

  constructor() {
    this.foodRepository = new SupabaseFoodRepository();
    this.foodDetailRepository = new SupabaseFoodDetailRepository();
  }

  async createFoodWithImageUrl(
    restaurantId: number,
    dishName: string,
    description: string,
    price: number,
    allergies: string[],
    ingredients: Array<{ name: string; calories: number }>,
    imageUrl?: string
  ): Promise<{ success: boolean; foodId?: number; error?: string }> {
    try {
      console.log('Creating food with image URL:', {
        restaurantId,
        dishName,
        hasImageUrl: !!imageUrl
      });

      // Create food record with provided image URL
      console.log('Creating food record...');
      const food = await this.foodRepository.create({
        restaurant_id: restaurantId,
        name: dishName,
        description: description || undefined,
        price: parseFloat(price.toString()),
        allergies: allergies.length > 0 ? allergies.join(', ') : undefined,
        image_url: imageUrl
      });

      if (!food || !food.id) {
        return { success: false, error: 'Failed to create food item' };
      }

      console.log('Food record created with ID:', food.id);

      // Create food details (ingredients)
      if (ingredients.length > 0) {
        console.log('Creating food details...');
        const foodDetails = ingredients.map(ingredient => ({
          food_id: food.id!,
          ingredient_name: ingredient.name,
          calories_count: ingredient.calories
        }));

        const createdDetails = await this.foodDetailRepository.createMultiple(foodDetails);
        console.log('Food details created:', createdDetails.length);
        
        if (createdDetails.length !== ingredients.length) {
          console.warn('Some ingredients may not have been saved properly');
        }
      }

      return { success: true, foodId: food.id };
    } catch (error) {
      console.error('Error in createFoodWithImageUrl:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getFoodWithDetails(foodId: number): Promise<{ food: Food | null; details: FoodDetail[] }> {
    try {
      const food = await this.foodRepository.findById(foodId);
      const details = food ? await this.foodDetailRepository.findByFoodId(foodId) : [];
      
      return { food, details };
    } catch (error) {
      console.error('Error in getFoodWithDetails:', error);
      return { food: null, details: [] };
    }
  }

  async getRestaurantFoods(restaurantId: number): Promise<Food[]> {
    try {
      return await this.foodRepository.findByRestaurantId(restaurantId);
    } catch (error) {
      console.error('Error in getRestaurantFoods:', error);
      return [];
    }
  }
}

// Service Layer using Unit of Work Pattern
export class FoodService {
  private unitOfWork: FoodUnitOfWork;

  constructor() {
    this.unitOfWork = new FoodUnitOfWork();
  }

  async createFoodWithImageUrl(
    restaurantId: number,
    dishName: string,
    description: string,
    price: number,
    allergies: string[],
    ingredients: Array<{ name: string; calories: number }>,
    imageUrl?: string
  ): Promise<{ success: boolean; foodId?: number; error?: string }> {
    // Validation
    if (!dishName.trim()) {
      return { success: false, error: 'Dish name is required' };
    }

    if (price <= 0) {
      return { success: false, error: 'Price must be greater than 0' };
    }

    if (ingredients.length === 0) {
      return { success: false, error: 'At least one ingredient is required' };
    }

    return await this.unitOfWork.createFoodWithImageUrl(
      restaurantId,
      dishName,
      description,
      price,
      allergies,
      ingredients,
      imageUrl
    );
  }

  async getRestaurantMenu(restaurantId: number): Promise<Food[]> {
    return await this.unitOfWork.getRestaurantFoods(restaurantId);
  }

  async getFoodDetails(foodId: number): Promise<{ food: Food | null; details: FoodDetail[] }> {
    return await this.unitOfWork.getFoodWithDetails(foodId);
  }
}