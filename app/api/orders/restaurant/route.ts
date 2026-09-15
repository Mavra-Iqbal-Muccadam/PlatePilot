import { NextRequest, NextResponse } from 'next/server';
import { OrderServiceFactory } from '../../../../lib/services/order-service';
import { AuthFactory } from '../../../../lib/auth/jwt-auth';

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

    // Use restaurant ID from JWT token
    const restaurantId = parseInt(authPayload.userId);

    // Get restaurant orders using service
    const orderService = OrderServiceFactory.createService();
    const orders = await orderService.getRestaurantOrders(restaurantId);

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error in get restaurant orders API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}