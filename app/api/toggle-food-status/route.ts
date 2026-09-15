import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';

export async function PATCH(request: NextRequest) {
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
    const { foodId, enabled } = body;

    // Validation
    if (!foodId) {
      return NextResponse.json(
        { success: false, error: 'Food ID is required' },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Enabled status must be a boolean' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    // Update the enabled status in the database
    const { supabase } = await import('../../../lib/supabase');
    
    const { data, error } = await supabase
      .from('food')
      .update({ enabled: enabled })
      .eq('id', foodId)
      .eq('restaurant_id', restaurantId) // Ensure user can only update their own food items
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update food status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Food item not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Food status updated successfully',
      enabled: data.enabled
    });

  } catch (error) {
    console.error('Error in toggle-food-status API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}