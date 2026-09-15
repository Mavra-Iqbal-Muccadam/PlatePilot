import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';

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
    console.log('Raw request body:', body);
    
    const { dealId, itemId, quantity } = body;

    console.log('Extracted values:', { 
      dealId, 
      itemId, 
      quantity,
      dealIdType: typeof dealId,
      itemIdType: typeof itemId,
      quantityType: typeof quantity,
      dealIdTruthy: !!dealId,
      itemIdTruthy: !!itemId,
      quantityTruthy: !!quantity,
      quantityUndefined: quantity === undefined,
      quantityZero: quantity === 0
    });

    if (!dealId || !itemId || quantity === undefined || quantity <= 0) {
      console.log('Validation failed:', {
        noDealId: !dealId,
        noItemId: !itemId,
        quantityUndefined: quantity === undefined,
        quantityTooLow: quantity <= 0
      });
      return NextResponse.json(
        { success: false, error: 'Valid deal ID, item ID, and quantity are required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // First, verify the item belongs to the correct deal and restaurant
    const { data: itemCheck, error: itemCheckError } = await supabase
      .from('deal_items')
      .select(`
        id,
        deal_id,
        deals!inner (
          restaurant_id
        )
      `)
      .eq('id', itemId)
      .single();

    console.log('Item verification:', { itemCheck, itemCheckError });

    if (itemCheckError || !itemCheck) {
      return NextResponse.json(
        { success: false, error: 'Deal item not found' },
        { status: 404 }
      );
    }

    if (itemCheck.deal_id !== dealId) {
      return NextResponse.json(
        { success: false, error: 'Item does not belong to the specified deal' },
        { status: 400 }
      );
    }

    if (itemCheck.deals.restaurant_id !== restaurantId) {
      return NextResponse.json(
        { success: false, error: 'Access denied - deal belongs to different restaurant' },
        { status: 403 }
      );
    }

    // Update the deal item quantity
    const { data, error } = await supabase
      .from('deal_items')
      .update({ quantity })
      .eq('id', itemId)
      .select('id');

    console.log('Update result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update item quantity: ' + error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to update item quantity' },
        { status: 500 }
      );
    }

    // Recalculate original price based on new quantities
    const { data: dealItems, error: itemsError } = await supabase
      .from('deal_items')
      .select(`
        quantity,
        food (
          price
        )
      `)
      .eq('deal_id', dealId);

    if (!itemsError && dealItems) {
      const newOriginalPrice = dealItems.reduce((total, item: any) => {
        return total + (parseFloat(item.food.price) * item.quantity);
      }, 0);

      // Update the deal's original price
      await supabase
        .from('deals')
        .update({ original_price: newOriginalPrice })
        .eq('id', dealId);

      return NextResponse.json({
        success: true,
        message: 'Item quantity updated successfully',
        newOriginalPrice
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Item quantity updated successfully'
    });

  } catch (error) {
    console.error('Error in update-deal-item-quantity API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}