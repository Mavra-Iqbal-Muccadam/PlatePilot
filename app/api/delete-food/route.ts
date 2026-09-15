import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';

export async function DELETE(request: NextRequest) {
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
    const { foodId } = body;

    // Validation
    if (!foodId) {
      return NextResponse.json(
        { success: false, error: 'Food ID is required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    // Get Supabase client
    const { supabase } = await import('../../../lib/supabase');

    // First, verify the food item belongs to the authenticated restaurant
    const { data: foodItem, error: verifyError } = await supabase
      .from('food')
      .select('id, name')
      .eq('id', foodId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (verifyError || !foodItem) {
      return NextResponse.json(
        { success: false, error: 'Food item not found or access denied' },
        { status: 404 }
      );
    }

    // Delete food details first (due to foreign key constraint)
    const { error: detailsError } = await supabase
      .from('food_details')
      .delete()
      .eq('food_id', foodId);

    if (detailsError) {
      console.error('Error deleting food details:', detailsError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete food details' },
        { status: 500 }
      );
    }

    // Then delete the food item
    const { error: foodError } = await supabase
      .from('food')
      .delete()
      .eq('id', foodId)
      .eq('restaurant_id', restaurantId);

    if (foodError) {
      console.error('Error deleting food item:', foodError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete food item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Food item "${foodItem.name}" deleted successfully`
    });

  } catch (error) {
    console.error('Error in delete-food API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}