import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';
import { DealGenerationStrategy } from '../../../lib/ai-strategies';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { budget } = body;

    // Validation
    if (!budget || budget <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid budget is required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    // Fetch restaurant's food items
    const { supabase } = await import('../../../lib/supabase');
    
    const { data: foodItems, error: fetchError } = await supabase
      .from('food')
      .select('id, name, price')
      .eq('restaurant_id', restaurantId)
      .eq('enabled', true); // Only get enabled food items

    if (fetchError) {
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch food items' },
        { status: 500 }
      );
    }

    if (!foodItems || foodItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No food items found. Please add some menu items first.' },
        { status: 404 }
      );
    }

    console.log('Generating deals for budget:', budget, 'with', foodItems.length, 'food items');

    // Use Strategy Pattern for deal generation
    const dealStrategy = new DealGenerationStrategy();
    const result = await dealStrategy.generateDeals({
      budget,
      foodItems: foodItems.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price.toString())
      }))
    });

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        deals: result.data,
        budget: budget,
        availableItems: foodItems.length
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate deals' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-deals API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}