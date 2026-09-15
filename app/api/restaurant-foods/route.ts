import { NextRequest, NextResponse } from 'next/server';
import { FoodService } from '../../../lib/services/menu-item-service';
import { AuthFactory } from '../../../lib/auth/jwt-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request using JWT
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);
    
    // Get all foods for the restaurant
    const foodService = new FoodService();
    const foods = await foodService.getRestaurantMenu(restaurantId);
    
    // Get details for each food
    const foodsWithDetails = await Promise.all(
      foods.map(async (food) => {
        const { details } = await foodService.getFoodDetails(food.id!);
        return {
          ...food,
          ingredients: details
        };
      })
    );

    return NextResponse.json({
      success: true,
      foods: foodsWithDetails
    });
  } catch (error) {
    console.error('Error in restaurant-foods API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}