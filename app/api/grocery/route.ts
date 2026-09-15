import { NextRequest, NextResponse } from 'next/server';
import { GroceryServiceFactory } from '../../../lib/services/grocery-service';

// GET - Fetch user's grocery list
export async function GET(request: NextRequest) {
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
    const groceryList = await groceryService.getUserGroceryList(parseInt(userId));

    return NextResponse.json({
      success: true,
      groceryList: groceryList
    });

  } catch (error) {
    console.error('Error fetching grocery list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grocery list: ' + errorMessage },
      { status: 500 }
    );
  }
}

// POST - Add food ingredients to grocery list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, food_item, use_ai = false } = body;

    if (!user_id || !food_item) {
      return NextResponse.json(
        { success: false, error: 'User ID and food item are required' },
        { status: 400 }
      );
    }

    // Choose strategy based on request
    const groceryService = use_ai 
      ? GroceryServiceFactory.createWithAIStrategy()
      : GroceryServiceFactory.createWithFoodDetailsStrategy();

    const addedItems = await groceryService.addFoodIngredientsToList(user_id, food_item);

    return NextResponse.json({
      success: true,
      message: `Added ${addedItems.length} ingredients from ${food_item.name} to your grocery list`,
      addedItems: addedItems
    });

  } catch (error) {
    console.error('Error adding ingredients to grocery list:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to add ingredients: ' + errorMessage },
      { status: 500 }
    );
  }
}