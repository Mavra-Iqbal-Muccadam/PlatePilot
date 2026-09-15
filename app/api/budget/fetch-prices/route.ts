import { NextRequest, NextResponse } from 'next/server';
import { BudgetPlanningServiceFactory } from '../../../../lib/services/budget-planning-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching prices for user ${user_id}`);

    // Get user's grocery list with items
    const { supabase } = await import('../../../../lib/supabase');
    
    const { data: groceryList, error: listError } = await supabase
      .from('grocery_lists')
      .select(`
        id,
        name,
        grocery_items (
          id,
          ingredient_name,
          quantity,
          unit,
          estimated_price,
          is_purchased,
          price_fetched_at
        )
      `)
      .eq('user_id', user_id)
      .single();

    if (listError || !groceryList) {
      console.error('Grocery list error:', listError);
      return NextResponse.json(
        { success: false, error: 'Grocery list not found' },
        { status: 404 }
      );
    }

    if (!groceryList.grocery_items || groceryList.grocery_items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in grocery list to fetch prices for' },
        { status: 400 }
      );
    }

    console.log(`Found ${groceryList.grocery_items.length} items to price`);

    // Transform items for budget service
    const budgetItems = groceryList.grocery_items.map((item: any) => ({
      id: item.id,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      estimated_price: item.estimated_price || 0,
      is_purchased: item.is_purchased
    }));

    // Use budget planning service to fetch prices
    const budgetService = BudgetPlanningServiceFactory.createService();
    
    console.log('Starting price fetching process...');
    const updatedItems = await budgetService.fetchAndUpdatePrices(budgetItems);
    console.log('Price fetching completed');

    // Calculate budget summary
    const budgetSummary = budgetService.calculateBudget(updatedItems);
    console.log('Budget summary calculated:', budgetSummary);

    return NextResponse.json({
      success: true,
      message: `Prices fetched and updated for ${updatedItems.length} items`,
      budgetSummary,
      updatedItems: updatedItems.map(item => ({
        id: item.id,
        ingredient_name: item.ingredient_name,
        estimated_price: item.estimated_price
      }))
    });

  } catch (error) {
    console.error('Error in fetch-prices API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prices: ' + errorMessage },
      { status: 500 }
    );
  }
}