// Strategy Pattern for Food Search
export interface FoodSearchStrategy {
  search(query: string, foodItems: any[]): Promise<any[]>;
}

// Concrete Strategy for AI-powered food search
export class AIFoodSearchStrategy implements FoodSearchStrategy {
  async search(query: string, foodItems: any[]): Promise<any[]> {
    try {
      // Use AI to analyze the query and match with food items
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
              content: `You are a food search expert. Given a user's food description and a list of available food items, return the most relevant matches.

Available food items: ${JSON.stringify(foodItems.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                ingredients: item.ingredients?.map((ing: any) => ing.ingredient_name).join(', ')
              })))}

Return a JSON array of food item IDs that best match the user's description, ordered by relevance (most relevant first). Only return IDs that exist in the available items. Maximum 5 results.

Example response: [1, 3, 7, 2]`
            },
            {
              role: "user",
              content: `Find food items that match this description: "${query}"`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return this.fallbackSearch(query, foodItems);
      }

      try {
        const matchedIds = JSON.parse(content.trim());
        
        // Return food items in the order of relevance
        const results = matchedIds
          .map((id: number) => foodItems.find(item => item.id === id))
          .filter((item: any) => item !== undefined);
        
        return results.length > 0 ? results : this.fallbackSearch(query, foodItems);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return this.fallbackSearch(query, foodItems);
      }

    } catch (error) {
      console.error('Error in AI food search:', error);
      return this.fallbackSearch(query, foodItems);
    }
  }

  private fallbackSearch(query: string, foodItems: any[]): any[] {
    // Simple text-based fallback search
    const queryLower = query.toLowerCase();
    const keywords = queryLower.split(' ').filter(word => word.length > 2);
    
    return foodItems
      .map(item => {
        let score = 0;
        const itemText = `${item.name} ${item.description || ''}`.toLowerCase();
        
        // Check for exact matches in name
        if (item.name.toLowerCase().includes(queryLower)) {
          score += 10;
        }
        
        // Check for keyword matches
        keywords.forEach(keyword => {
          if (itemText.includes(keyword)) {
            score += 1;
          }
        });
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5);
  }
}

// Context class for food search
export class FoodSearchContext {
  private strategy: FoodSearchStrategy;

  constructor(strategy: FoodSearchStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: FoodSearchStrategy): void {
    this.strategy = strategy;
  }

  async executeSearch(query: string, foodItems: any[]): Promise<any[]> {
    return await this.strategy.search(query, foodItems);
  }
}

// Factory for creating search strategies
export class FoodSearchStrategyFactory {
  static createAISearchStrategy(): AIFoodSearchStrategy {
    return new AIFoodSearchStrategy();
  }
}