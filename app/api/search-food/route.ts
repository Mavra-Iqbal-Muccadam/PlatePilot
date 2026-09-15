import { NextRequest, NextResponse } from 'next/server';
import { 
  FoodSearchContext, 
  FoodSearchStrategyFactory 
} from '../../../lib/strategies/food-search-strategy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Fetch all available food items with ingredients
    const { data: foodItems, error: foodError } = await supabase
      .from('food')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        enabled,
        restaurant_id,
        restaurant_user (
          name,
          profile_pic
        ),
        food_details (
          ingredient_name
        )
      `)
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    if (foodError) {
      console.error('Database error:', foodError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch food items' },
        { status: 500 }
      );
    }

    if (!foodItems || foodItems.length === 0) {
      return NextResponse.json({
        success: true,
        foods: [],
        message: 'No food items available'
      });
    }

    // Transform data for search
    const transformedFoodItems = foodItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price.toString()),
      image_url: item.image_url,
      restaurant_id: item.restaurant_id,
      restaurant_name: item.restaurant_user?.name || 'Unknown Restaurant',
      restaurant_profile: item.restaurant_user?.profile_pic,
      ingredients: item.food_details || []
    }));

    console.log(`Searching for: "${query}" among ${transformedFoodItems.length} food items`);

    // Use Strategy Pattern for food search
    const searchStrategy = FoodSearchStrategyFactory.createAISearchStrategy();
    const searchContext = new FoodSearchContext(searchStrategy);
    
    const searchResults = await searchContext.executeSearch(query, transformedFoodItems);

    console.log(`Found ${searchResults.length} matching food items`);

    return NextResponse.json({
      success: true,
      foods: searchResults,
      query: query,
      totalAvailable: transformedFoodItems.length
    });

  } catch (error) {
    console.error('Error in food search API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}