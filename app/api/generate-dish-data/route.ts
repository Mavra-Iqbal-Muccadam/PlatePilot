import { NextRequest, NextResponse } from 'next/server';
import { AIProcessingContext, AIStrategyFactory } from '../../../lib/ai-strategies';

export async function POST(request: NextRequest) {
  try {
    const { dishName, type } = await request.json();

    if (!dishName || !type) {
      return NextResponse.json(
        { error: 'Dish name and type are required' },
        { status: 400 }
      );
    }

    // Use Strategy Pattern to determine which AI processing strategy to use
    const context = new AIProcessingContext(
      type === 'ingredients' 
        ? AIStrategyFactory.createIngredientsStrategy()
        : AIStrategyFactory.createAllergiesStrategy()
    );

    const result = await context.executeStrategy(dishName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in AI processing:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}