import { NextRequest, NextResponse } from 'next/server';

// Command Pattern for Deal Activation
interface DealActivationCommand {
  execute(): Promise<{ success: boolean; dealId?: number; error?: string }>;
}

class ActivateDealCommand implements DealActivationCommand {
  constructor(
    private restaurantId: number,
    private dealData: {
      dealName: string;
      description: string;
      originalPrice: number;
      dealPrice: number;
      items: Array<{ id: number; name: string; price: number; quantity?: number }>;
    }
  ) {}

  async execute(): Promise<{ success: boolean; dealId?: number; error?: string }> {
    try {
      // Import supabase client
      const { supabase } = await import('../../../lib/supabase');
      
      // First, get all food items for this restaurant to map names to IDs
      const { data: foodItems, error: foodError } = await supabase
        .from('food')
        .select('id, name')
        .eq('restaurant_id', this.restaurantId);

      if (foodError) {
        console.error('Error fetching food items:', foodError);
        return { success: false, error: 'Failed to fetch food items' };
      }

      // Create a mapping from food names to IDs
      const foodNameToId = new Map<string, number>();
      foodItems?.forEach(item => {
        foodNameToId.set(item.name.toLowerCase().trim(), item.id);
      });

      // Start transaction by inserting deal first
      const { data: dealResult, error: dealError } = await supabase
        .from('deals')
        .insert({
          restaurant_id: this.restaurantId,
          deal_name: this.dealData.dealName,
          description: this.dealData.description,
          original_price: this.dealData.originalPrice,
          deal_price: this.dealData.dealPrice,
          is_active: true,
          current_uses: 0
        })
        .select('id')
        .single();

      if (dealError) {
        console.error('Error inserting deal:', dealError);
        return { success: false, error: 'Failed to create deal' };
      }

      const dealId = dealResult.id;

      // Map deal items to food IDs and insert
      const dealItems = this.dealData.items.map(item => {
        // Try to get food ID from the item (if it has an id property)
        let foodId = item.id;
        
        // If no ID, try to map by name
        if (!foodId) {
          const itemNameLower = item.name.toLowerCase().trim();
          const mappedId = foodNameToId.get(itemNameLower);
          if (mappedId) {
            foodId = mappedId;
          }
        }

        if (!foodId) {
          console.error(`Could not find food ID for item: ${item.name}`);
          throw new Error(`Food item "${item.name}" not found in restaurant menu`);
        }

        return {
          deal_id: dealId,
          food_id: foodId,
          quantity: item.quantity || 1
        };
      });

      console.log('Inserting deal items:', dealItems);

      const { error: itemsError } = await supabase
        .from('deal_items')
        .insert(dealItems);

      if (itemsError) {
        console.error('Error inserting deal items:', itemsError);
        
        // Rollback: Delete the deal if items insertion failed
        await supabase
          .from('deals')
          .delete()
          .eq('id', dealId);
        
        return { success: false, error: 'Failed to create deal items' };
      }

      return { success: true, dealId };
    } catch (error) {
      console.error('Error in deal activation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Internal server error' };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request using JWT (same pattern as create-food)
    const { AuthFactory } = await import('../../../lib/auth/jwt-auth');
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { dealData } = body;

    if (!dealData) {
      return NextResponse.json({ success: false, error: 'Deal data is required' }, { status: 400 });
    }

    // Validate required fields
    if (!dealData.dealName || !dealData.description || 
        dealData.originalPrice === undefined || dealData.dealPrice === undefined ||
        !dealData.items || !Array.isArray(dealData.items) || dealData.items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required deal data fields' 
      }, { status: 400 });
    }

    // Use restaurant ID from JWT token
    const restaurantId = parseInt(authPayload.userId);

    // Execute deal activation command
    const command = new ActivateDealCommand(restaurantId, dealData);
    const result = await command.execute();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Deal activated successfully',
        dealId: result.dealId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in activate-deal API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}