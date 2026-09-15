import { OpenRouter } from "@openrouter/sdk";

// Strategy Pattern Implementation for AI Processing

// Abstract Strategy Interface
export interface AIProcessingStrategy {
  process(dishName: string): Promise<any>;
}

// Concrete Strategy for Ingredients Processing
export class IngredientsStrategy implements AIProcessingStrategy {
  private openrouter: OpenRouter;

  constructor() {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!
    });
  }

  async process(dishName: string): Promise<{ ingredients: Array<{ name: string; calories: number }> }> {
    const prompt = `For the dish "${dishName}", provide a JSON response with ingredients and their calories per serving. Format:
    {
      "ingredients": [
        {"name": "ingredient_name", "calories": number},
        {"name": "ingredient_name", "calories": number}
      ]
    }
    Only return valid JSON, no additional text.`;

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
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const fullResponse = data.choices[0]?.message?.content || '';

      return JSON.parse(fullResponse.trim());
    } catch (error) {
      console.error('Error parsing ingredients JSON:', error);
      return { ingredients: [] };
    }
  }
}

// Concrete Strategy for Allergies Processing
export class AllergiesStrategy implements AIProcessingStrategy {
  private openrouter: OpenRouter;

  constructor() {
    this.openrouter = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!
    });
  }

  async process(dishName: string): Promise<{ allergies: string[] }> {
    const prompt = `For the dish "${dishName}", provide a JSON response with common allergies/allergens. Format:
    {
      "allergies": ["allergy1", "allergy2", "allergy3"]
    }
    Include common allergens like nuts, dairy, gluten, eggs, soy, shellfish, etc. Only return valid JSON, no additional text.`;

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
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const fullResponse = data.choices[0]?.message?.content || '';

      return JSON.parse(fullResponse.trim());
    } catch (error) {
      console.error('Error parsing allergies JSON:', error);
      return { allergies: [] };
    }
  }
}

// Context Class that uses the strategies
export class AIProcessingContext {
  private strategy: AIProcessingStrategy;

  constructor(strategy: AIProcessingStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: AIProcessingStrategy) {
    this.strategy = strategy;
  }

  async executeStrategy(dishName: string): Promise<any> {
    return await this.strategy.process(dishName);
  }
}

// Healthy Dish Generation Strategy
export class HealthyDishStrategy {
  async generateContent(params: { dishName: string; ingredients: string }): Promise<{
    success: boolean;
    data?: {
      name: string;
      description: string;
      healthyIngredients: Array<{ original: string; healthy: string; reason: string; calories: number }>;
      recipe: string;
      allergies: string[];
      healthBenefits: string[];
      calorieReduction: number;
    };
    error?: string;
  }> {
    const { dishName, ingredients } = params;
    
    const prompt = `Transform the dish "${dishName}" with ingredients "${ingredients}" into a healthier version by suggesting healthier ingredient substitutions.

Please provide a JSON response with the following structure:
{
  "name": "Healthy version name of the dish",
  "description": "Brief description of the healthier version (2-3 sentences)",
  "healthyIngredients": [
    {
      "original": "original ingredient",
      "healthy": "healthy substitute",
      "reason": "why this substitute is healthier",
      "calories": estimated_calories_per_serving
    }
  ],
  "recipe": "Step-by-step cooking instructions using the healthy substitutes",
  "allergies": ["list", "of", "potential", "allergens"],
  "healthBenefits": ["list", "of", "health", "benefits"],
  "calorieReduction": estimated_percentage_calorie_reduction
}

Requirements:
- Suggest healthier alternatives (e.g., brown sugar instead of white sugar, whole wheat instead of refined flour)
- Focus on reducing calories, increasing nutrients, reducing processed ingredients
- Provide clear reasons for each substitution
- Maintain the essence and taste of the original dish
- Include estimated calorie reduction percentage`;

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
              content: "You are a professional nutritionist and chef specializing in healthy food transformations. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return { success: false, error: 'No response from AI' };
      }

      // Parse JSON response
      const result = JSON.parse(content.trim());
      
      return {
        success: true,
        data: {
          name: result.name || `Healthy ${dishName}`,
          description: result.description || 'A healthier version of your favorite dish.',
          healthyIngredients: Array.isArray(result.healthyIngredients) ? result.healthyIngredients : [],
          recipe: result.recipe || 'Recipe instructions not available.',
          allergies: Array.isArray(result.allergies) ? result.allergies : [],
          healthBenefits: Array.isArray(result.healthBenefits) ? result.healthBenefits : [],
          calorieReduction: result.calorieReduction || 0
        }
      };

    } catch (error) {
      console.error('Error in healthy dish generation:', error);
      return { success: false, error: 'Failed to generate healthy dish version' };
    }
  }
}

// Sustainable Dish Generation Strategy
export class SustainableDishGenerationStrategy {
  async generateSustainableDish(ingredients: Array<{ ingredient_name: string; calories_count: number; count: number }>): Promise<{
    name: string;
    description: string;
    allergies: string[];
    recipe: string;
  }> {
    const ingredientList = ingredients.map(ing => `${ing.ingredient_name} (${ing.calories_count} cal, quantity: ${ing.count})`).join(', ');
    
    const prompt = `Create a sustainable and delicious dish using these specific ingredients: ${ingredientList}.

Please provide a JSON response with the following structure:
{
  "name": "Name of the dish",
  "description": "Brief description of the dish (2-3 sentences)",
  "allergies": ["list", "of", "potential", "allergens"],
  "recipe": "Detailed step-by-step cooking instructions"
}

Requirements:
- Use ONLY the provided ingredients
- Focus on sustainability and eco-friendly cooking
- Provide clear, easy-to-follow recipe steps
- Consider nutritional balance
- Mention potential allergens based on ingredients`;

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
              content: "You are a professional chef specializing in sustainable cooking. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI');
      }

      // Parse JSON response
      const result = JSON.parse(content.trim());
      
      return {
        name: result.name || 'Sustainable Dish',
        description: result.description || 'A delicious sustainable dish made with selected ingredients.',
        allergies: Array.isArray(result.allergies) ? result.allergies : [],
        recipe: result.recipe || 'Recipe instructions not available.'
      };

    } catch (error) {
      console.error('Error in sustainable dish generation:', error);
      throw new Error('Failed to generate sustainable dish');
    }
  }
}

// Deal Generation Strategy
export class DealGenerationStrategy {
  async generateDeals(params: { 
    budget: number; 
    foodItems: Array<{ name: string; price: number; id: number }> 
  }): Promise<{
    success: boolean;
    data?: Array<{
      dealName: string;
      description: string;
      items: Array<{ name: string; price: number; id: number }>;
      originalPrice: number;
      dealPrice: number;
      savings: number;
      savingsPercentage: number;
    }>;
    error?: string;
  }> {
    const { budget, foodItems } = params;
    
    // Create food items list for AI
    const itemsList = foodItems.map(item => `${item.name} ($${item.price})`).join(', ');
    
    const prompt = `Create 4 attractive food combo deals for a restaurant with a budget of $${budget}. 

Available food items: ${itemsList}

Please provide a JSON response with exactly 4 deals in this structure:
{
  "deals": [
    {
      "dealName": "Catchy deal name",
      "description": "Brief description of the deal",
      "items": [
        {"name": "item1", "price": price1},
        {"name": "item2", "price": price2}
      ],
      "originalPrice": total_original_price,
      "dealPrice": discounted_price,
      "savings": amount_saved,
      "savingsPercentage": percentage_saved
    }
  ]
}

Requirements:
- Each deal should combine 2-3 food items
- Deal price should be within the $${budget} budget
- Focus on popular combinations (burger + fries, pizza + drink, etc.)
- Make deals attractive with good savings (15-30% off)
- Use catchy, marketing-friendly names
- Ensure all item names and prices match the provided list exactly`;

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
              content: "You are a marketing expert specializing in restaurant deals and promotions. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return { success: false, error: 'No response from AI' };
      }

      // Parse JSON response
      const result = JSON.parse(content.trim());
      
      // Map food names back to IDs and add them to the items
      const dealsWithIds = result.deals?.map((deal: any) => {
        const itemsWithIds = deal.items?.map((item: any) => {
          // Find the matching food item by name
          const matchingFood = foodItems.find(food => 
            food.name.toLowerCase().trim() === item.name.toLowerCase().trim()
          );
          
          return {
            ...item,
            id: matchingFood?.id || null // Add the food ID
          };
        });
        
        return {
          ...deal,
          items: itemsWithIds
        };
      });
      
      return {
        success: true,
        data: Array.isArray(dealsWithIds) ? dealsWithIds : []
      };

    } catch (error) {
      console.error('Error in deal generation:', error);
      return { success: false, error: 'Failed to generate deals' };
    }
  }
}
// Factory for creating strategies
export class AIStrategyFactory {
  static createIngredientsStrategy(): IngredientsStrategy {
    return new IngredientsStrategy();
  }

  static createAllergiesStrategy(): AllergiesStrategy {
    return new AllergiesStrategy();
  }

  static createSustainableDishStrategy(): SustainableDishGenerationStrategy {
    return new SustainableDishGenerationStrategy();
  }

  static createHealthyDishStrategy(): HealthyDishStrategy {
    return new HealthyDishStrategy();
  }

  static createDealGenerationStrategy(): DealGenerationStrategy {
    return new DealGenerationStrategy();
  }
}