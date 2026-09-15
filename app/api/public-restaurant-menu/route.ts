import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Fetch restaurant information
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurant_user')
      .select('id, name, profile_pic')
      .eq('id', restaurantId)
      .single();

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Fetch menu items with ingredients
    const { data: menuItems, error: menuError } = await supabase
      .from('food')
      .select(`
        id,
        name,
        description,
        price,
        allergies,
        image_url,
        enabled,
        food_details (
          id,
          ingredient_name,
          calories_count
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (menuError) {
      console.error('Database error:', menuError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch menu items' },
        { status: 500 }
      );
    }

    // Transform the data to include ingredients
    const transformedMenuItems = menuItems?.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: parseFloat(item.price.toString()),
      allergies: item.allergies || '',
      image_url: item.image_url || '',
      enabled: item.enabled,
      ingredients: item.food_details.map((detail: any) => ({
        id: detail.id,
        ingredient_name: detail.ingredient_name,
        calories_count: detail.calories_count || 0
      }))
    })) || [];

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        profile_pic: restaurant.profile_pic
      },
      menuItems: transformedMenuItems
    });

  } catch (error) {
    console.error('Error in public restaurant menu API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}