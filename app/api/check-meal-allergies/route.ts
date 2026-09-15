import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { foodId, userId } = body;

    console.log(`[check-meal-allergies] Checking allergies for foodId: ${foodId}, userId: ${userId}`);

    if (!foodId || !userId) {
      return NextResponse.json(
        { success: false, error: 'foodId and userId are required' },
        { status: 400 }
      );
    }

    // Fetch meal allergies
    const { data: foodData, error: foodError } = await supabase
      .from('food')
      .select('allergies')
      .eq('id', foodId)
      .single();

    if (foodError) {
      console.error('[check-meal-allergies] Error fetching food allergies:', foodError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch meal allergies' },
        { status: 500 }
      );
    }

    const mealAllergies = foodData?.allergies || '';
    console.log('[check-meal-allergies] Meal allergies:', mealAllergies);

    // Fetch user allergies
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('allergies')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[check-meal-allergies] Error fetching user allergies:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user allergies' },
        { status: 500 }
      );
    }

    const userAllergies = userData?.allergies || [];
    console.log('[check-meal-allergies] User allergies:', userAllergies);

    // If user has no allergies, meal is safe
    if (!userAllergies || userAllergies.length === 0) {
      console.log('[check-meal-allergies] User has no allergies, meal is safe');
      return NextResponse.json({
        success: true,
        isAllergic: false,
        reason: 'No allergies recorded',
      });
    }

    // If meal has no allergies listed, assume safe
    if (!mealAllergies || mealAllergies.trim() === '') {
      console.log('[check-meal-allergies] Meal has no allergies listed, assuming safe');
      return NextResponse.json({
        success: true,
        isAllergic: false,
        reason: 'No allergens detected',
      });
    }

    console.log('[check-meal-allergies] Calling Qwen model to check allergies...');

    // Call Qwen model to check if user is allergic
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
            content: `You are an allergy checker. A user has the following allergies: ${userAllergies.join(', ')}

This meal contains or may contain: ${mealAllergies}

Based on the user's allergies and the meal's ingredients/allergens, is the user allergic to this meal?

Answer ONLY with "yes" if the user is allergic to this meal, or "no" if the user is not allergic.
Do not include any other text, just "yes" or "no".`,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      }),
    });

    console.log('[check-meal-allergies] Qwen response status:', response.status);

    const data = await response.json();
    console.log('[check-meal-allergies] Qwen response data:', data);

    // Check if response has error
    if (data.error) {
      console.error('[check-meal-allergies] Qwen API error:', data.error);
      // If API fails, assume meal is safe (fail-safe approach)
      return NextResponse.json({
        success: true,
        isAllergic: false,
        reason: 'Unable to verify allergies - meal assumed safe',
      });
    }

    if (!response.ok || !data.choices) {
      console.error('[check-meal-allergies] Invalid response:', data);
      // If API fails, assume meal is safe (fail-safe approach)
      return NextResponse.json({
        success: true,
        isAllergic: false,
        reason: 'Unable to verify allergies - meal assumed safe',
      });
    }

    // Extract the response text
    const responseText = (data.choices[0]?.message?.content || '').trim().toLowerCase();
    console.log('[check-meal-allergies] Response text:', responseText);

    // Parse yes/no response
    const isAllergic = responseText.includes('yes');
    console.log('[check-meal-allergies] Is allergic:', isAllergic);

    return NextResponse.json({
      success: true,
      isAllergic,
      reason: isAllergic ? 'User may be allergic to this meal' : 'Meal appears safe for user',
      mealAllergies,
      userAllergies,
    });
  } catch (error) {
    console.error('[check-meal-allergies] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
