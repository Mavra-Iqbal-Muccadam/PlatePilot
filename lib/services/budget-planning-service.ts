// Strategy Pattern for price fetching
export interface PriceFetchingStrategy {
  fetchPrice(ingredientName: string, quantity: number, unit: string): Promise<number>;
}

export class LLMPriceFetchingStrategy implements PriceFetchingStrategy {
  async fetchPrice(ingredientName: string, quantity: number, unit: string): Promise<number> {
    try {
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
              content: `You are a grocery pricing expert. Provide realistic grocery store prices in USD for ingredients. Return only a number (the price in dollars) with up to 2 decimal places. Consider average US grocery store prices.`
            },
            {
              role: "user",
              content: `What is the estimated price in USD for ${quantity} ${unit} of ${ingredientName}? Return only the number.`
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('LLM API response not ok:', response.status, response.statusText);
        return this.getFallbackPrice(ingredientName, quantity, unit);
      }

      const data = await response.json();
      console.log('LLM API response:', data); // Debug log
      
      // Check if response has the expected structure
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('Invalid LLM response structure:', data);
        return this.getFallbackPrice(ingredientName, quantity, unit);
      }

      const choice = data.choices[0];
      if (!choice || !choice.message || typeof choice.message.content !== 'string') {
        console.error('Invalid choice structure:', choice);
        return this.getFallbackPrice(ingredientName, quantity, unit);
      }

      const priceText = choice.message.content.trim();
      
      if (priceText) {
        // Try to extract price from the response
        const priceMatch = priceText.match(/\d+\.?\d*/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0]);
          if (!isNaN(price) && price > 0) {
            console.log(`LLM price fetched for ${ingredientName}: ${price}`);
            return Math.max(0.25, Math.min(50, price)); // Clamp between $0.25 and $50
          }
        }
        
        // If no valid number found, try parsing the whole string
        const directPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (!isNaN(directPrice) && directPrice > 0) {
          console.log(`LLM price (direct parse) for ${ingredientName}: ${directPrice}`);
          return Math.max(0.25, Math.min(50, directPrice));
        }
      }
    } catch (error) {
      console.error('LLM price fetching failed:', error);
    }

    // Always fallback to estimated pricing if anything goes wrong
    return this.getFallbackPrice(ingredientName, quantity, unit);
  }

  private getFallbackPrice(ingredientName: string, quantity: number, unit: string): number {
    console.log(`Using fallback pricing for: ${ingredientName} (${quantity} ${unit})`);
    
    // Fallback pricing based on common grocery items
    const basePrices: { [key: string]: number } = {
      // Vegetables (per piece/unit)
      'onion': 0.50, 'tomato': 0.75, 'potato': 0.40, 'carrot': 0.30,
      'lettuce': 2.50, 'spinach': 3.00, 'bell pepper': 1.25, 'garlic': 0.25,
      'cucumber': 0.80, 'broccoli': 2.00, 'cauliflower': 2.50, 'celery': 1.50,
      
      // Fruits
      'apple': 0.75, 'banana': 0.25, 'orange': 0.60, 'lemon': 0.50,
      'lime': 0.40, 'mango': 1.50, 'grapes': 3.00, 'strawberry': 4.00,
      
      // Meat & Poultry (per pound/kg)
      'chicken': 4.50, 'beef': 8.00, 'pork': 5.50, 'fish': 7.00,
      'salmon': 12.00, 'tuna': 10.00, 'turkey': 5.00, 'lamb': 10.00,
      
      // Dairy
      'milk': 3.50, 'cheese': 5.00, 'butter': 4.00, 'eggs': 2.50,
      'yogurt': 4.00, 'cream': 3.00, 'sour cream': 2.50,
      
      // Grains & Pantry
      'rice': 2.00, 'bread': 2.50, 'flour': 3.00, 'oil': 4.00,
      'pasta': 1.50, 'noodles': 2.00, 'oats': 3.50, 'quinoa': 6.00,
      
      // Spices (per unit)
      'salt': 1.00, 'pepper': 3.00, 'cumin': 2.50, 'turmeric': 2.00,
      'paprika': 2.50, 'oregano': 2.00, 'basil': 2.50, 'thyme': 2.00,
      
      // Condiments and sauces
      'ketchup': 2.50, 'mustard': 2.00, 'mayonnaise': 3.00, 'vinegar': 2.50,
      'soy sauce': 3.00, 'hot sauce': 2.50, 'barbecue sauce': 2.50
    };

    const ingredientLower = ingredientName.toLowerCase();
    let basePrice = 2.00; // Increased default price

    // Find matching ingredient with partial matching
    for (const [key, price] of Object.entries(basePrices)) {
      if (ingredientLower.includes(key) || key.includes(ingredientLower)) {
        basePrice = price;
        break;
      }
    }

    // Adjust for unit and quantity
    const unitMultipliers: { [key: string]: number } = {
      'piece': 1, 'item': 1, 'unit': 1, 'each': 1,
      'kg': 2.2, 'kilogram': 2.2, 'pound': 1, 'lb': 1, 'lbs': 1,
      'gram': 0.001, 'g': 0.001, 'grams': 0.001,
      'liter': 1, 'l': 1, 'litre': 1, 'cup': 0.25, 'cups': 0.25,
      'tablespoon': 0.015, 'tbsp': 0.015, 'teaspoon': 0.005, 'tsp': 0.005,
      'ounce': 0.0625, 'oz': 0.0625, 'pint': 0.5, 'quart': 1, 'gallon': 4
    };

    const multiplier = unitMultipliers[unit.toLowerCase()] || 1;
    const finalPrice = basePrice * quantity * multiplier;
    
    // Ensure minimum price of $0.25 and maximum of $50 per item
    const clampedPrice = Math.max(0.25, Math.min(50, finalPrice));
    const roundedPrice = Math.round(clampedPrice * 100) / 100;
    
    console.log(`Fallback price calculated: ${ingredientName} = $${roundedPrice}`);
    return roundedPrice;
  }
}

// Calculator Pattern for budget calculations
export interface BudgetCalculator {
  calculateTotal(items: BudgetItem[]): BudgetSummary;
  calculateCategoryTotals(items: BudgetItem[]): { [category: string]: number };
}

export interface BudgetItem {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  is_purchased: boolean;
  category?: string;
}

export interface BudgetSummary {
  totalItems: number;
  totalCost: number;
  purchasedCost: number;
  remainingCost: number;
  categoryBreakdown: { [category: string]: number };
  averageItemCost: number;
}

export class StandardBudgetCalculator implements BudgetCalculator {
  calculateTotal(items: BudgetItem[]): BudgetSummary {
    const totalItems = items.length;
    const totalCost = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const purchasedCost = items
      .filter(item => item.is_purchased)
      .reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const remainingCost = totalCost - purchasedCost;
    const categoryBreakdown = this.calculateCategoryTotals(items);
    const averageItemCost = totalItems > 0 ? totalCost / totalItems : 0;

    return {
      totalItems,
      totalCost: Math.round(totalCost * 100) / 100,
      purchasedCost: Math.round(purchasedCost * 100) / 100,
      remainingCost: Math.round(remainingCost * 100) / 100,
      categoryBreakdown,
      averageItemCost: Math.round(averageItemCost * 100) / 100
    };
  }

  calculateCategoryTotals(items: BudgetItem[]): { [category: string]: number } {
    const categoryTotals: { [category: string]: number } = {};
    
    items.forEach(item => {
      const category = item.category || 'Other';
      categoryTotals[category] = (categoryTotals[category] || 0) + (item.estimated_price || 0);
    });

    // Round all values
    Object.keys(categoryTotals).forEach(key => {
      categoryTotals[key] = Math.round(categoryTotals[key] * 100) / 100;
    });

    return categoryTotals;
  }
}

// Command Pattern for budget operations
export interface BudgetCommand {
  execute(): Promise<any>;
}

export class FetchPricesCommand implements BudgetCommand {
  constructor(
    private pricingStrategy: PriceFetchingStrategy,
    private items: BudgetItem[]
  ) {}

  async execute(): Promise<BudgetItem[]> {
    const updatedItems: BudgetItem[] = [];
    
    console.log(`Fetching prices for ${this.items.length} items`);
    
    for (const item of this.items) {
      try {
        console.log(`Fetching price for: ${item.ingredient_name} (${item.quantity} ${item.unit})`);
        
        const estimatedPrice = await this.pricingStrategy.fetchPrice(
          item.ingredient_name,
          item.quantity,
          item.unit
        );
        
        console.log(`Price fetched for ${item.ingredient_name}: $${estimatedPrice}`);
        
        updatedItems.push({
          ...item,
          estimated_price: estimatedPrice
        });
      } catch (error) {
        console.error(`Error fetching price for ${item.ingredient_name}:`, error);
        // Keep original item with fallback price if available
        updatedItems.push({
          ...item,
          estimated_price: item.estimated_price || 1.00 // Default fallback price
        });
      }
    }
    
    console.log(`Price fetching completed. Updated ${updatedItems.length} items`);
    return updatedItems;
  }
}

export class GenerateBudgetPDFCommand implements BudgetCommand {
  constructor(
    private groceryList: any,
    private budgetSummary: BudgetSummary,
    private userName: string
  ) {}

  async execute(): Promise<{ pdfBlob: Blob; filename: string }> {
    // Generate PDF using jsPDF
    return this.generatePDFBlob();
  }

  private generatePDFBlob(): { pdfBlob: Blob; filename: string } {
    // We'll implement this on the client side since jsPDF works in browser
    // For now, return structured data that the client can use
    const currentDate = new Date().toLocaleDateString();
    const filename = `grocery-budget-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Return the data structure that the client will use to generate PDF
    const pdfData = {
      title: 'Grocery Budget Plan',
      date: currentDate,
      userName: this.userName,
      budgetSummary: this.budgetSummary,
      groceryList: this.groceryList,
      items: this.groceryList.grocery_items || []
    };

    // Create a blob with the PDF data (client will handle actual PDF generation)
    const blob = new Blob([JSON.stringify(pdfData)], { type: 'application/json' });
    
    return { pdfBlob: blob, filename };
  }
}

// Repository Pattern for budget data
export interface BudgetRepository {
  updateItemPrices(items: { id: number; estimated_price: number }[]): Promise<boolean>;
  clearGroceryList(userId: number): Promise<boolean>;
}

export class SupabaseBudgetRepository implements BudgetRepository {
  async updateItemPrices(items: { id: number; estimated_price: number }[]): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    try {
      for (const item of items) {
        const { error } = await supabase
          .from('grocery_items')
          .update({ 
            estimated_price: item.estimated_price,
            price_fetched_at: new Date().toISOString()
          })
          .eq('id', item.id);
          
        if (error) {
          console.error('Error updating item price:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error in updateItemPrices:', error);
      return false;
    }
  }

  async clearGroceryList(userId: number): Promise<boolean> {
    const { supabase } = await import('../supabase');
    
    try {
      // First get the user's grocery list
      const { data: groceryList } = await supabase
        .from('grocery_lists')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!groceryList) return false;

      // Delete all items from the grocery list
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('grocery_list_id', groceryList.id);

      if (error) {
        console.error('Error clearing grocery list:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearGroceryList:', error);
      return false;
    }
  }
}

// Service Layer for budget planning
export class BudgetPlanningService {
  constructor(
    private pricingStrategy: PriceFetchingStrategy,
    private calculator: BudgetCalculator,
    private repository: BudgetRepository
  ) {}

  async fetchAndUpdatePrices(items: BudgetItem[]): Promise<BudgetItem[]> {
    const fetchCommand = new FetchPricesCommand(this.pricingStrategy, items);
    const updatedItems = await fetchCommand.execute();
    
    // Update prices in database
    const priceUpdates = updatedItems.map(item => ({
      id: item.id,
      estimated_price: item.estimated_price
    }));
    
    await this.repository.updateItemPrices(priceUpdates);
    
    return updatedItems;
  }

  calculateBudget(items: BudgetItem[]): BudgetSummary {
    return this.calculator.calculateTotal(items);
  }

  async generateBudgetPDF(groceryList: any, budgetSummary: BudgetSummary, userName: string): Promise<{ pdfData: any; filename: string }> {
    const pdfCommand = new GenerateBudgetPDFCommand(groceryList, budgetSummary, userName);
    const result = await pdfCommand.execute();
    
    // Parse the JSON data from the blob
    const pdfDataText = await result.pdfBlob.text();
    const pdfData = JSON.parse(pdfDataText);
    
    return { pdfData, filename: result.filename };
  }

  async downloadPDFAndClearList(groceryList: any, budgetSummary: BudgetSummary, userName: string, userId: number): Promise<{ pdfData: any; filename: string; cleared: boolean }> {
    // Generate PDF data
    const { pdfData, filename } = await this.generateBudgetPDF(groceryList, budgetSummary, userName);
    
    // Clear grocery list
    const cleared = await this.repository.clearGroceryList(userId);
    
    return { pdfData, filename, cleared };
  }
}

// Factory for creating budget planning service
export class BudgetPlanningServiceFactory {
  static createService(): BudgetPlanningService {
    const pricingStrategy = new LLMPriceFetchingStrategy();
    const calculator = new StandardBudgetCalculator();
    const repository = new SupabaseBudgetRepository();
    
    return new BudgetPlanningService(pricingStrategy, calculator, repository);
  }
}