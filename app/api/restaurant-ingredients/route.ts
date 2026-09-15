import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching ingredients for restaurant:', restaurantId);

    // Get all food items for this restaurant with their ingredients
    const { data: foodItems, error: foodError } = await supabase
      .from('food')
      .select(`
        id,
        name,
        food_details (
          ingredient_name,
          calories_count
        )
      `)
      .eq('restaurant_id', parseInt(restaurantId));

    if (foodError) {
      console.error('Error fetching food items:', foodError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ingredients' },
        { status: 500 }
      );
    }

    console.log('Found food items:', foodItems?.length);

    // Process ingredients to count frequency and aggregate data
    const ingredientMap = new Map();

    foodItems?.forEach(food => {
      food.food_details?.forEach((detail: any) => {
        const ingredientName = detail.ingredient_name;
        const calories = detail.calories_count;

        if (ingredientMap.has(ingredientName)) {
          const existing = ingredientMap.get(ingredientName);
          existing.count += 1;
          // Use average calories if different values exist
          existing.calories_count = Math.round((existing.calories_count + calories) / 2);
        } else {
          ingredientMap.set(ingredientName, {
            ingredient_name: ingredientName,
            calories_count: calories,
            count: 1
          });
        }
      });
    });

    // Convert map to array and sort by frequency
    const ingredients = Array.from(ingredientMap.values())
      .sort((a, b) => b.count - a.count);

    console.log('Processed ingredients:', ingredients.length);

    return NextResponse.json({
      success: true,
      ingredients,
      totalFoodItems: foodItems?.length || 0
    });

  } catch (error) {
    console.error('Error in restaurant-ingredients API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}