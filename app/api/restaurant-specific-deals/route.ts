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

    // Fetch active deals for this specific restaurant
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        deal_name,
        description,
        original_price,
        deal_price,
        current_uses,
        total_calories,
        created_at,
        deal_items (
          quantity,
          food (
            name,
            total_calories,
            food_details (
              ingredient_name,
              calories_count
            )
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Database error:', dealsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Transform the data to include savings calculations
    const transformedDeals = deals?.map(deal => {
      const originalPrice = parseFloat(deal.original_price.toString());
      const dealPrice = parseFloat(deal.deal_price.toString());
      const savings = originalPrice - dealPrice;
      const savingsPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

      return {
        id: deal.id,
        deal_name: deal.deal_name,
        description: deal.description || '',
        original_price: originalPrice,
        deal_price: dealPrice,
        current_uses: deal.current_uses || 0,
        created_at: deal.created_at,
        items: deal.deal_items.map((item: any) => {
          const foodCal = Number(item.food?.total_calories) || 0;
          const ingredients = (item.food?.food_details || []).map((fd: any) => ({
            name: fd.ingredient_name,
            calories: Number(fd.calories_count) || 0,
          }));
          return {
            food_name: item.food?.name || 'Item',
            quantity: item.quantity,
            calories_per_item: foodCal,
            total_calories: foodCal * item.quantity,
            ingredients,
          };
        }),
        // Sum calories across all items (quantity × per-item calories)
        total_calories: deal.deal_items.reduce((sum: number, item: any) => {
          return sum + (Number(item.food?.total_calories) || 0) * item.quantity;
        }, 0),
        savings: Math.max(0, savings),
        savingsPercentage: Math.max(0, savingsPercentage)
      };
    }) || [];

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        profile_pic: restaurant.profile_pic
      },
      deals: transformedDeals
    });

  } catch (error) {
    console.error('Error in restaurant specific deals API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}