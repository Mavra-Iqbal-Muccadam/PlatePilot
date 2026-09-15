import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Fetch all restaurants with menu item count
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurant_user')
      .select(`
        id,
        name,
        email,
        profile_pic,
        created_at,
        food (count)
      `)
      .order('created_at', { ascending: false });

    if (restaurantsError) {
      console.error('Database error:', restaurantsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    // Transform the data to include menu count
    const transformedRestaurants = restaurants?.map(restaurant => ({
      id: restaurant.id,
      name: restaurant.name,
      email: restaurant.email,
      profile_pic: restaurant.profile_pic,
      created_at: restaurant.created_at,
      menu_count: restaurant.food?.[0]?.count || 0
    })) || [];

    return NextResponse.json({
      success: true,
      restaurants: transformedRestaurants
    });

  } catch (error) {
    console.error('Error in public restaurants API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}