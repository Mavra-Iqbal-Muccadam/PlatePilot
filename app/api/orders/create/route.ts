import { NextRequest, NextResponse } from 'next/server';
import { OrderServiceFactory, OrderData } from '../../../../lib/services/order-service';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      userId, 
      restaurantId, 
      items, 
      deliveryAddress, 
      phoneNumber, 
      specialInstructions 
    } = body;

    // Validation
    if (!userId || !restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required order data' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number' || !item.type) {
        return NextResponse.json(
          { success: false, error: 'Invalid item data. Each item must have id, name, price, quantity, and type' },
          { status: 400 }
        );
      }
      if (item.price <= 0 || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Item price and quantity must be greater than 0' },
          { status: 400 }
        );
      }
      if (!['food', 'deal'].includes(item.type)) {
        return NextResponse.json(
          { success: false, error: 'Item type must be "food" or "deal"' },
          { status: 400 }
        );
      }
    }

    const resolvedUserId = tokenUserId ?? Number(userId);
    if (!Number.isFinite(resolvedUserId) || resolvedUserId <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid user identity' },
        { status: 400 }
      );
    }

    const orderData: OrderData = {
      userId: resolvedUserId,
      restaurantId: parseInt(restaurantId),
      items,
      deliveryAddress,
      phoneNumber,
      specialInstructions
    };

    // Create order using simplified service
    const orderService = OrderServiceFactory.createService();
    const result = await orderService.createOrder(orderData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Order created successfully',
        orderId: result.orderId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in create order API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}