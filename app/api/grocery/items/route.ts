import { NextRequest, NextResponse } from 'next/server';
import { GroceryServiceFactory } from '../../../../lib/services/grocery-service';

// POST - Add custom item to grocery list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ingredient_name, quantity = 1, unit = 'piece' } = body;

    if (!user_id || !ingredient_name) {
      return NextResponse.json(
        { success: false, error: 'User ID and ingredient name are required' },
        { status: 400 }
      );
    }

    const groceryService = GroceryServiceFactory.createWithFoodDetailsStrategy();
    const addedItem = await groceryService.addCustomItem(user_id, {
      ingredient_name,
      quantity: parseFloat(quantity),
      unit
    });

    return NextResponse.json({
      success: true,
      message: `Added ${ingredient_name} to your grocery list`,
      addedItem: addedItem
    });

  } catch (error) {
    console.error('Error adding custom item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to add custom item: ' + errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Remove item from grocery list
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const groceryService = GroceryServiceFactory.createWithFoodDetailsStrategy();
    await groceryService.removeItem(parseInt(itemId));

    return NextResponse.json({
      success: true,
      message: 'Item removed from grocery list'
    });

  } catch (error) {
    console.error('Error removing item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to remove item: ' + errorMessage },
      { status: 500 }
    );
  }
}

// PATCH - Update item (quantity or purchased status)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_id, quantity, is_purchased } = body;

    if (!item_id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const groceryService = GroceryServiceFactory.createWithFoodDetailsStrategy();

    if (quantity !== undefined) {
      await groceryService.updateItemQuantity(item_id, parseFloat(quantity));
    }

    if (is_purchased !== undefined) {
      await groceryService.toggleItemPurchased(item_id, is_purchased);
    }

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully'
    });

  } catch (error) {
    console.error('Error updating item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to update item: ' + errorMessage },
      { status: 500 }
    );
  }
}