import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../lib/auth/jwt-auth';
import { HealthyDishStrategy } from '../../../lib/ai-strategies';

export async function POST(request: NextRequest) {
  try {
    // Authenticate request using JWT
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dishName, ingredients } = body;

    // Validation
    if (!dishName) {
      return NextResponse.json(
        { success: false, error: 'Dish name is required' },
        { status: 400 }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ingredients are required' },
        { status: 400 }
      );
    }

    console.log('Generating healthy version for:', { dishName, ingredients });

    // Use Strategy Pattern for healthy dish generation
    const healthyStrategy = new HealthyDishStrategy();
    const result = await healthyStrategy.generateContent({
      dishName,
      ingredients: ingredients.join(', ')
    });

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        healthyDish: result.data
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate healthy dish' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-healthy-dish API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}