import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import supabase client
    const { supabase } = await import('../../../../lib/supabase');

    // Fetch all restaurants with basic info
    const { data: restaurants, error } = await supabase
      .from('restaurant_user')
      .select('id, name, profile_pic, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      restaurants: restaurants || []
    });

  } catch (error) {
    console.error('Error in restaurants list API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}