import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

// GET - Get current calorie count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Try to get existing tracker record
    const { data: trackerData, error } = await supabase
      .from('user_calorie_tracker')
      .select('daily_calories, daily_limit')
      .eq('user_id', parseInt(userId))
      .eq('date', today)
      .single();

    let currentCalories = 0;
    let dailyLimit = 2000;

    if (error && error.code === 'PGRST116') {
      // No record found, create one
      const { data: newTracker, error: insertError } = await supabase
        .from('user_calorie_tracker')
        .insert({
          user_id: parseInt(userId),
          daily_calories: 0,
          daily_limit: 2000,
          date: today
        })
        .select('daily_calories, daily_limit')
        .single();

      if (insertError) {
        console.error('Error creating tracker:', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      currentCalories = newTracker.daily_calories;
      dailyLimit = newTracker.daily_limit;
    } else if (error) {
      console.error('Error getting calories:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    } else {
      currentCalories = trackerData.daily_calories;
      dailyLimit = trackerData.daily_limit;
    }

    return NextResponse.json({
      success: true,
      tracker: {
        current_calories: currentCalories,
        daily_limit: dailyLimit,
        limit_exceeded: currentCalories > dailyLimit,
        remaining_calories: Math.max(0, dailyLimit - currentCalories)
      }
    });
  } catch (error) {
    console.error('Error in calorie tracker GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add calories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, calories } = body;

    if (!userId || !calories) {
      return NextResponse.json(
        { success: false, error: 'userId and calories are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const calorieAmount = parseInt(calories);

    // First, try to get existing record
    const { data: existingData, error: selectError } = await supabase
      .from('user_calorie_tracker')
      .select('daily_calories, daily_limit')
      .eq('user_id', parseInt(userId))
      .eq('date', today)
      .single();

    let newTotal, dailyLimit;

    if (selectError && selectError.code === 'PGRST116') {
      // No record exists, create new one
      const { data: newData, error: insertError } = await supabase
        .from('user_calorie_tracker')
        .insert({
          user_id: parseInt(userId),
          date: today,
          daily_calories: calorieAmount,
          daily_limit: 2000,
          updated_at: new Date().toISOString()
        })
        .select('daily_calories, daily_limit')
        .single();

      if (insertError) {
        console.error('Error creating tracker:', insertError);
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }

      newTotal = newData.daily_calories;
      dailyLimit = newData.daily_limit;
    } else if (selectError) {
      console.error('Error getting existing tracker:', selectError);
      return NextResponse.json(
        { success: false, error: selectError.message },
        { status: 500 }
      );
    } else {
      // Record exists, update it
      newTotal = existingData.daily_calories + calorieAmount;
      dailyLimit = existingData.daily_limit;

      const { error: updateError } = await supabase
        .from('user_calorie_tracker')
        .update({
          daily_calories: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', parseInt(userId))
        .eq('date', today);

      if (updateError) {
        console.error('Error updating calories:', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      tracker: {
        current_calories: newTotal,
        daily_limit: dailyLimit,
        limit_exceeded: newTotal > dailyLimit,
        remaining_calories: Math.max(0, dailyLimit - newTotal),
        calories_added: calorieAmount
      },
      message: newTotal > dailyLimit 
        ? 'Calories added but daily limit exceeded!' 
        : 'Calories added successfully'
    });
  } catch (error) {
    console.error('Error in calorie tracker POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update daily limit
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, dailyLimit } = body;

    if (!userId || !dailyLimit) {
      return NextResponse.json(
        { success: false, error: 'userId and dailyLimit are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_calorie_tracker')
      .upsert({
        user_id: parseInt(userId),
        date: today,
        daily_calories: 0,
        daily_limit: parseInt(dailyLimit),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select('daily_calories, daily_limit')
      .single();

    if (error) {
      console.error('Error setting limit:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tracker: {
        current_calories: data.daily_calories,
        daily_limit: data.daily_limit,
        limit_exceeded: data.daily_calories > data.daily_limit,
        remaining_calories: Math.max(0, data.daily_limit - data.daily_calories)
      },
      message: 'Daily limit updated successfully'
    });
  } catch (error) {
    console.error('Error in calorie tracker PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Reset calories to 0
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_calorie_tracker')
      .update({
        daily_calories: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', parseInt(userId))
      .eq('date', today)
      .select('daily_calories, daily_limit')
      .single();

    if (error) {
      console.error('Error resetting calories:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tracker: {
        current_calories: 0,
        daily_limit: data.daily_limit,
        limit_exceeded: false,
        remaining_calories: data.daily_limit
      },
      message: 'Calories reset successfully'
    });
  } catch (error) {
    console.error('Error in calorie tracker DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}