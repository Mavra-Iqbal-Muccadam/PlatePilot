// Repository Pattern for grocery data access
export interface GroceryRepository {
  getUserGroceryList(userId: number): Promise<any>;
  createGroceryList(userId: number, name: string): Promise<any>;
  addItemsToList(listId: number, items: GroceryItem[]): Promise<any>;
  removeItemFromList(itemId: number): Promise<boolean>;
  updateItemQuantity(itemId: number, quantity: number): Promise<boolean>;
  toggleItemPurchased(itemId: number, isPurchased: boolean): Promise<boolean>;
  addCustomItem(listId: number, item: CustomGroceryItem): Promise<any>;
  clearPurchasedItems(listId: number): Promise<boolean>;
}

export interface GroceryItem {
  ingredient_name: string;
  quantity: number;
  unit: string;
  source_food_id?: number;
  source_food_name?: string;
  is_custom?: boolean;
}

export interface CustomGroceryItem {
  ingredient_name: string;
  quantity: number;
  unit: string;
}

export class SupabaseGroceryRepository implements GroceryRepository {
  async getUserGroceryList(userId: number): Promise<any> {
    const { supabase } = await import('../supabase');
    
    // First, try to get existing grocery list
    let { data: groceryList, error: listError } = await supabase
      .from('grocery_lists')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        grocery_items (
          id,
          ingredient_name,
          quantity,
          unit,
          is_purchased,
          source_food_id,
          source_food_name,
          is_custom,
          created_at
        )
      `)
      .eq('user_id', userId)
      .single();

    // If no list exists, create one
    if (listError && listError.code === 'PGRST116') {
      const newList = await this.createGroceryList(userId, 'My Grocery List');
      return newList;
    }

    if (listError) {
      throw new Error(`Failed to fetch grocery list: ${listError.message}`);
    }

    return groceryList;
  }

  async createGroceryList(userId: number, name: string): Promise<any> {
    const { supabase } = await import('../supabase');
    
    const { data, error } = await supabase
      .from('grocery_lists')
      .insert({
        user_id: userId,
        name: name
      })
      .select(`
        id,
        name,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create grocery list: ${error.message}`);
    }

    // Return with empty items array
    return {
      ...data,
      grocery_items: []
    };
  }

  async addItemsToList(listId: number, items: GroceryItem[]): Promise<any> {
    const { supabase } = await import('../supabase');
    
    const itemsToInsert = items.map(item => ({
      grocery_list_id: listId,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      source_food_id: item.source_food_id,
      source_food_name: item.source_food_name,
      is_custom: item.is_custom || false
    }));

    const { data, error } = await supabase
      .from('grocery_items')
      .insert(itemsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to add items to grocery list: ${error.message}`);
    }

    return data;
  }

  async removeItemFromList(itemId: number): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to remove item: ${error.message}`);
    }

    return true;
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    const { error } = await supabase
      .from('grocery_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to update quantity: ${error.message}`);
    }

    return true;
  }

  async toggleItemPurchased(itemId: number, isPurchased: boolean): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    const { error } = await supabase
      .from('grocery_items')
      .update({ is_purchased: isPurchased })
      .eq('id', itemId);

    if (error) {
      throw new Error(`Failed to toggle purchased status: ${error.message}`);
    }

    return true;
  }

  async addCustomItem(listId: number, item: CustomGroceryItem): Promise<any> {
    const { supabase } = await import('../supabase');
    
    const { data, error } = await supabase
      .from('grocery_items')
      .insert({
        grocery_list_id: listId,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity,
        unit: item.unit,
        is_custom: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add custom item: ${error.message}`);
    }

    return data;
  }

  async clearPurchasedItems(listId: number): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .eq('grocery_list_id', listId)
      .eq('is_purchased', true);

    if (error) {
      throw new Error(`Failed to clear purchased items: ${error.message}`);
    }

    return true;
  }
}

// Strategy Pattern for ingredient extraction
export interface IngredientExtractionStrategy {
  extractIngredients(foodItem: any): GroceryItem[] | Promise<GroceryItem[]>;
}

export class FoodDetailsExtractionStrategy implements IngredientExtractionStrategy {
  extractIngredients(foodItem: any): GroceryItem[] {
    if (!foodItem.food_details || !Array.isArray(foodItem.food_details)) {
      return [];
    }

    return foodItem.food_details.map((detail: any) => ({
      ingredient_name: detail.ingredient_name,
      quantity: 1, // Default quantity
      unit: 'piece', // Default unit
      source_food_id: foodItem.id,
      source_food_name: foodItem.name,
      is_custom: false
    }));
  }
}

export class AIIngredientExtractionStrategy implements IngredientExtractionStrategy {
  async extractIngredients(foodItem: any): Promise<GroceryItem[]> {
    try {
      // Use AI to extract ingredients from food name and description
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [
            {
              role: "system",
              content: `You are a culinary expert. Extract the main ingredients needed to make a dish. Return a JSON array of objects with: ingredient_name, quantity (number), unit (string like 'cup', 'piece', 'gram', 'tablespoon'). Be practical and realistic about quantities.`
            },
            {
              role: "user",
              content: `Extract ingredients for: "${foodItem.name}" - ${foodItem.description || 'No description available'}`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        const ingredients = JSON.parse(content);
        return ingredients.map((ing: any) => ({
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity || 1,
          unit: ing.unit || 'piece',
          source_food_id: foodItem.id,
          source_food_name: foodItem.name,
          is_custom: false
        }));
      }
    } catch (error) {
      console.error('AI ingredient extraction failed:', error);
    }

    // Fallback to basic extraction
    return new FoodDetailsExtractionStrategy().extractIngredients(foodItem);
  }
}

// Factory Pattern for creating extraction strategies
export class IngredientExtractionFactory {
  static createFoodDetailsStrategy(): FoodDetailsExtractionStrategy {
    return new FoodDetailsExtractionStrategy();
  }

  static createAIStrategy(): AIIngredientExtractionStrategy {
    return new AIIngredientExtractionStrategy();
  }
}

// Command Pattern for grocery operations
export interface GroceryCommand {
  execute(): Promise<any>;
  undo?(): Promise<any>;
}

export class AddIngredientsCommand implements GroceryCommand {
  constructor(
    private groceryRepository: GroceryRepository,
    private listId: number,
    private ingredients: GroceryItem[]
  ) {}

  async execute(): Promise<any> {
    return await this.groceryRepository.addItemsToList(this.listId, this.ingredients);
  }
}

export class RemoveItemCommand implements GroceryCommand {
  constructor(
    private groceryRepository: GroceryRepository,
    private itemId: number
  ) {}

  async execute(): Promise<any> {
    return await this.groceryRepository.removeItemFromList(this.itemId);
  }
}

export class AddCustomItemCommand implements GroceryCommand {
  constructor(
    private groceryRepository: GroceryRepository,
    private listId: number,
    private item: CustomGroceryItem
  ) {}

  async execute(): Promise<any> {
    return await this.groceryRepository.addCustomItem(this.listId, this.item);
  }
}

// Service Layer orchestrating all grocery operations
export class GroceryService {
  constructor(
    private groceryRepository: GroceryRepository,
    private extractionStrategy: IngredientExtractionStrategy
  ) {}

  async getUserGroceryList(userId: number): Promise<any> {
    return await this.groceryRepository.getUserGroceryList(userId);
  }

  async addFoodIngredientsToList(userId: number, foodItem: any): Promise<any> {
    // Get user's grocery list
    const groceryList = await this.groceryRepository.getUserGroceryList(userId);
    
    // Extract ingredients using strategy
    let ingredients: GroceryItem[];
    if (this.extractionStrategy instanceof AIIngredientExtractionStrategy) {
      ingredients = await (this.extractionStrategy as AIIngredientExtractionStrategy).extractIngredients(foodItem);
    } else {
      ingredients = this.extractionStrategy.extractIngredients(foodItem) as GroceryItem[];
    }

    if (ingredients.length === 0) {
      throw new Error('No ingredients found for this food item');
    }

    // Use Command Pattern to add ingredients
    const addCommand = new AddIngredientsCommand(
      this.groceryRepository,
      groceryList.id,
      ingredients
    );

    return await addCommand.execute();
  }

  async removeItem(itemId: number): Promise<boolean> {
    const removeCommand = new RemoveItemCommand(this.groceryRepository, itemId);
    return await removeCommand.execute();
  }

  async addCustomItem(userId: number, item: CustomGroceryItem): Promise<any> {
    const groceryList = await this.groceryRepository.getUserGroceryList(userId);
    const addCommand = new AddCustomItemCommand(this.groceryRepository, groceryList.id, item);
    return await addCommand.execute();
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<boolean> {
    return await this.groceryRepository.updateItemQuantity(itemId, quantity);
  }

  async toggleItemPurchased(itemId: number, isPurchased: boolean): Promise<boolean> {
    return await this.groceryRepository.toggleItemPurchased(itemId, isPurchased);
  }

  async clearPurchasedItems(userId: number): Promise<boolean> {
    const groceryList = await this.groceryRepository.getUserGroceryList(userId);
    return await this.groceryRepository.clearPurchasedItems(groceryList.id);
  }
}

// Factory for creating grocery service with appropriate strategies
export class GroceryServiceFactory {
  static createWithFoodDetailsStrategy(): GroceryService {
    const repository = new SupabaseGroceryRepository();
    const strategy = IngredientExtractionFactory.createFoodDetailsStrategy();
    return new GroceryService(repository, strategy);
  }

  static createWithAIStrategy(): GroceryService {
    const repository = new SupabaseGroceryRepository();
    const strategy = IngredientExtractionFactory.createAIStrategy();
    return new GroceryService(repository, strategy);
  }
}