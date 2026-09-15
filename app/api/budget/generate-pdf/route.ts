import { NextRequest, NextResponse } from 'next/server';
import { BudgetPlanningServiceFactory } from '../../../../lib/services/budget-planning-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, user_name } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's grocery list with items
    const { supabase } = await import('../../../../lib/supabase');
    
    const { data: groceryList, error: listError } = await supabase
      .from('grocery_lists')
      .select(`
        id,
        name,
        created_at,
        grocery_items (
          id,
          ingredient_name,
          quantity,
          unit,
          estimated_price,
          is_purchased,
          source_food_name,
          is_custom
        )
      `)
      .eq('user_id', user_id)
      .single();

    if (listError || !groceryList) {
      return NextResponse.json(
        { success: false, error: 'Grocery list not found' },
        { status: 404 }
      );
    }

    if (!groceryList.grocery_items || groceryList.grocery_items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in grocery list to generate PDF' },
        { status: 400 }
      );
    }

    // Transform items for budget service
    const budgetItems = groceryList.grocery_items.map((item: any) => ({
      id: item.id,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      estimated_price: item.estimated_price || 0,
      is_purchased: item.is_purchased,
      category: categorizeIngredient(item.ingredient_name)
    }));

    // Use budget planning service
    const budgetService = BudgetPlanningServiceFactory.createService();
    const budgetSummary = budgetService.calculateBudget(budgetItems);

    // Generate PDF and clear list
    const result = await budgetService.downloadPDFAndClearList(
      groceryList, 
      budgetSummary, 
      user_name || 'User', 
      user_id
    );

    if (!result.cleared) {
      return NextResponse.json(
        { success: false, error: 'Failed to clear grocery list after PDF generation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PDF data generated and grocery list cleared successfully',
      pdfData: result.pdfData,
      filename: result.filename,
      budgetSummary,
      listCleared: result.cleared
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF: ' + errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to categorize ingredients
function categorizeIngredient(ingredientName: string): string {
  const categories = {
    'Vegetables': ['onion', 'tomato', 'potato', 'carrot', 'lettuce', 'spinach', 'bell pepper', 'garlic', 'ginger'],
    'Fruits': ['apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'grapes'],
    'Meat & Poultry': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'fish', 'salmon', 'tuna'],
    'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs'],
    'Grains & Bread': ['rice', 'bread', 'flour', 'pasta', 'noodles', 'oats', 'quinoa'],
    'Spices & Herbs': ['salt', 'pepper', 'cumin', 'turmeric', 'coriander', 'basil', 'oregano', 'thyme'],
    'Pantry': ['oil', 'vinegar', 'sugar', 'honey', 'soy sauce', 'ketchup', 'mustard']
  };

  const lowerName = ingredientName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}