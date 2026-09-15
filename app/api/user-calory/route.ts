import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

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

    // Fetch user calory data
    const { data, error } = await supabase
      .from('user_calory')
      .select('*')
      .eq('user_id', parseInt(userId))
      .single();

    if (error) {
      // If no record exists, create one with default values
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_calory')
          .insert({
            user_id: parseInt(userId),
            current_calory: 0,
            limit_calory: 2000,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating calory record:', insertError);
          return NextResponse.json(
            { success: false, error: insertError.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: newData,
        });
      }

      console.error('Error fetching calory data:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in user-calory API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, breakfast, lunch, dinner, current_calory, limit_calory } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Build update object with only defined fields
    const updateData: any = {};
    if (breakfast !== undefined) updateData.breakfast = breakfast;
    if (lunch !== undefined) updateData.lunch = lunch;
    if (dinner !== undefined) updateData.dinner = dinner;
    if (current_calory !== undefined) updateData.current_calory = current_calory;
    if (limit_calory !== undefined) updateData.limit_calory = limit_calory;

    // Update calory data
    const { data, error } = await supabase
      .from('user_calory')
      .update(updateData)
      .eq('user_id', parseInt(userId))
      .select();

    if (error) {
      console.error('Error updating calory data:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // If no rows were updated, return success but with empty data
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No records found to update'
      });
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error('Error in user-calory PUT API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
