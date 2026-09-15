import { NextRequest, NextResponse } from 'next/server';
import { GroceryServiceFactory } from '../../../../lib/services/grocery-service';

// DELETE - Clear all purchased items from grocery list
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const groceryService = GroceryServiceFactory.createWithFoodDetailsStrategy();
    await groceryService.clearPurchasedItems(parseInt(userId));

    return NextResponse.json({
      success: true,
      message: 'All purchased items cleared from grocery list'
    });

  } catch (error) {
    console.error('Error clearing purchased items:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to clear purchased items: ' + errorMessage },
      { status: 500 }
    );
  }
}