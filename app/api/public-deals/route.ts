import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Fetch all active deals with restaurant and food item information
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        deal_name,
        description,
        original_price,
        deal_price,
        current_uses,
        created_at,
        restaurant_user (
          id,
          name,
          profile_pic
        ),
        deal_items (
          quantity,
          food (
            name
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Database error:', dealsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Transform the data to include restaurant info and calculate savings
const transformedDeals = deals?.map(deal => {
  const originalPrice = parseFloat(deal.original_price.toString());
  const dealPrice = parseFloat(deal.deal_price.toString());
  const savings = originalPrice - dealPrice;
  const savingsPercentage = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  type RestaurantUser = { id: any; name: any; profile_pic: any } | null;

  const restaurantUser: RestaurantUser = Array.isArray(deal.restaurant_user)
    ? (deal.restaurant_user[0] ?? null)
    : (deal.restaurant_user as RestaurantUser);

  return {
    id: deal.id,
    deal_name: deal.deal_name,
    description: deal.description || '',
    original_price: originalPrice,
    deal_price: dealPrice,
    current_uses: deal.current_uses || 0,
    created_at: deal.created_at,
    restaurant: {
      id: restaurantUser?.id,
      name: restaurantUser?.name,
      profile_pic: restaurantUser?.profile_pic
    },
    items: deal.deal_items.map((item: any) => ({
      food_name: item.food.name,
      quantity: item.quantity
    })),
    savings: Math.max(0, savings),
    savingsPercentage: Math.max(0, savingsPercentage)
  };
}) || [];

    return NextResponse.json({
      success: true,
      deals: transformedDeals
    });

  } catch (error) {
    console.error('Error in public deals API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}