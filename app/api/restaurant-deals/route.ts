import { NextRequest, NextResponse } from 'next/server';
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

    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Fetch deals with their items
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        deal_name,
        description,
        original_price,
        deal_price,
        is_active,
        current_uses,
        created_at,
        deal_items (
          id,
          quantity,
          food (
            name
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (dealsError) {
      console.error('Database error:', dealsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch deals' },
        { status: 500 }
      );
    }

    // Transform the data to include food names
    const transformedDeals = deals?.map(deal => ({
      id: deal.id,
      deal_name: deal.deal_name,
      description: deal.description,
      original_price: parseFloat(deal.original_price.toString()),
      deal_price: parseFloat(deal.deal_price.toString()),
      is_active: deal.is_active,
      current_uses: deal.current_uses,
      created_at: deal.created_at,
      items: deal.deal_items.map((item: any) => ({
        id: item.id,
        food_name: item.food.name,
        quantity: item.quantity
      }))
    })) || [];

    return NextResponse.json({
      success: true,
      deals: transformedDeals
    });

  } catch (error) {
    console.error('Error in restaurant-deals API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}