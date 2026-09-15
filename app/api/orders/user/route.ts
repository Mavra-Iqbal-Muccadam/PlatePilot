import { NextRequest, NextResponse } from 'next/server';
import { OrderServiceFactory } from '../../../../lib/services/order-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let tokenUserId: number | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('user_')) {
        const rawTokenUserId = token.split('_')[1];
        const parsedTokenUserId = Number(rawTokenUserId);
        if (Number.isFinite(parsedTokenUserId) && parsedTokenUserId > 0) {
          tokenUserId = parsedTokenUserId;
        }
      }
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('user_id');
    const userId = tokenUserId ?? Number(requestedUserId);

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user orders using service
    const orderService = OrderServiceFactory.createService();
    const orders = await orderService.getUserOrders(userId);

    return NextResponse.json({
      success: true,
      orders
    });

  } catch (error) {
    console.error('Error in get user orders API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}