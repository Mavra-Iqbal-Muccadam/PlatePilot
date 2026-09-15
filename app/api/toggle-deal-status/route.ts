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
    const { dealId, isActive } = body;

    if (!dealId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Deal ID and status are required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    // Import supabase client
    const { supabase } = await import('../../../lib/supabase');

    // Update deal status, but only for deals belonging to this restaurant
    const { data, error } = await supabase
      .from('deals')
      .update({ is_active: isActive })
      .eq('id', dealId)
      .eq('restaurant_id', restaurantId)
      .select('id');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update deal status' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Deal not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deal ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error in toggle-deal-status API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}