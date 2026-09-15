import { NextRequest, NextResponse } from 'next/server';
import { CartServiceFactory } from '../../../lib/services/cart-service';

// GET - Fetch user's unified cart for a specific restaurant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const restaurantId = searchParams.get('restaurant_id');

    if (!userId || !restaurantId) {
      return NextResponse.json(
        { success: false, error: 'User ID and restaurant ID are required' },
        { status: 400 }
      );
    }

    const cartService = CartServiceFactory.createService();
    const cart = await cartService.getCart(parseInt(userId), parseInt(restaurantId));

    return NextResponse.json({
      success: true,
      cart
    });

  } catch (error) {
    console.error('Error in get cart API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

// POST - Add item to unified cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      restaurantId, 
      item 
    } = body;

    // Validation
    if (!userId || !restaurantId || !item) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate item data
    if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number' || !item.type) {
      return NextResponse.json(
        { success: false, error: 'Invalid item data. Item must have id, name, price, quantity, and type' },
        { status: 400 }
      );
    }

    if (!['food', 'deal'].includes(item.type)) {
      return NextResponse.json(
        { success: false, error: 'Item type must be "food" or "deal"' },
        { status: 400 }
      );
    }

    if (item.price <= 0 || item.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: 'Item price and quantity must be greater than 0' },
        { status: 400 }
      );
    }

    const cartService = CartServiceFactory.createService();
    const result = await cartService.addToCart(
      parseInt(userId),
      parseInt(restaurantId),
      item
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Item added to cart successfully',
        cart: result.cart
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in add to cart API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cart_id');

    if (!cartId) {
      return NextResponse.json(
        { success: false, error: 'Cart ID is required' },
        { status: 400 }
      );
    }

    const cartService = CartServiceFactory.createService();
    const result = await cartService.clearCart(parseInt(cartId));

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cart cleared successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in clear cart API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}