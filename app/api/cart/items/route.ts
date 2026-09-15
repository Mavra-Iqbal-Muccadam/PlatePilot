import { NextRequest, NextResponse } from 'next/server';
import { CartServiceFactory } from '../../../../lib/services/cart-service';

// PATCH - Update cart item quantity
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || typeof quantity !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Item ID and quantity are required' },
        { status: 400 }
      );
    }

    if (quantity < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity cannot be negative' },
        { status: 400 }
      );
    }

    const cartService = CartServiceFactory.createService();
    const result = await cartService.updateCartItem(parseInt(itemId), quantity);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: quantity === 0 ? 'Item removed from cart' : 'Cart item updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in update cart item API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const cartService = CartServiceFactory.createService();
    const result = await cartService.removeFromCart(parseInt(itemId));

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in remove cart item API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}