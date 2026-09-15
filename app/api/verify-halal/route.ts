import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredients } = body;

    console.log('Verify-halal API called with ingredients:', ingredients);

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      console.error('Invalid ingredients:', ingredients);
      return NextResponse.json(
        { success: false, error: 'Ingredients array is required' },
        { status: 400 }
      );
    }

    console.log('Calling OpenRouter API with Qwen model...');

    // Call OpenRouter API to verify halal status using Qwen model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          {
            role: 'user',
            content: `You are a halal food verification expert. Analyze these ingredients and determine if ALL of them are halal (permissible in Islamic dietary law).

Ingredients: ${ingredients.join(', ')}

Rules:
- If ANY ingredient is haram (pork, alcohol, non-halal meat, shellfish, non-halal gelatin), the entire dish is NOT halal
- Answer ONLY with "yes" if ALL ingredients are halal
- Answer ONLY with "no" if ANY ingredient is not halal
- Do not include any other text, just "yes" or "no"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to verify halal status', details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('OpenRouter response data:', data);
    
    // Extract the response text
    const responseText = (data.choices[0]?.message?.content || '').trim().toLowerCase();
    console.log('Response text:', responseText);
    
    // Parse yes/no response
    const isHalal = responseText.includes('yes');
    console.log('Parsed isHalal:', isHalal);

    return NextResponse.json({
      success: true,
      isHalal: isHalal,
      reason: isHalal ? 'All ingredients are halal' : 'Some ingredients are not halal',
      concerns: isHalal ? [] : ['One or more ingredients may not be halal'],
    });
  } catch (error) {
    console.error('Error in verify-halal API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
