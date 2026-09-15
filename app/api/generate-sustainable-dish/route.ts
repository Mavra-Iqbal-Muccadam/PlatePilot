import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';
import { SustainableDishGenerationStrategy } from '../../../lib/ai-strategies';

// Command Pattern for Sustainable Dish Generation
export class GenerateSustainableDishCommand {
  private ingredients: Array<{ name: string; calories: number; count: number }>;
  private strategy: SustainableDishGenerationStrategy;

  constructor(
    ingredients: Array<{ name: string; calories: number; count: number }>,
    strategy: SustainableDishGenerationStrategy
  ) {
    this.ingredients = ingredients;
    this.strategy = strategy;
  }

  async execute(): Promise<{
    success: boolean;
    dish?: {
      name: string;
      description: string;
      allergies: string[];
      ingredients: Array<{ name: string; calories: number; count: number }>;
      recipe: string;
      totalCalories: number;
    };
    error?: string;
  }> {
    try {
      const result = await this.strategy.generateSustainableDish(this.ingredients);
      return {
        success: true,
        dish: {
          ...result,
          ingredients: this.ingredients,
          totalCalories: this.ingredients.reduce((sum, ing) => sum + (ing.calories * ing.count), 0)
        }
      };
    } catch (error) {
      console.error('Error generating sustainable dish:', error);
      return {
        success: false,
        error: 'Failed to generate sustainable dish'
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ingredients } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    console.log('Generating sustainable dish with ingredients:', ingredients);

    // Use Command Pattern with Strategy Pattern
    const strategy = new SustainableDishGenerationStrategy();
    const command = new GenerateSustainableDishCommand(ingredients, strategy);
    const result = await command.execute();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in generate-sustainable-dish API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}