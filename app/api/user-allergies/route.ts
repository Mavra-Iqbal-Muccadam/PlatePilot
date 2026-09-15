import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`[GET /api/user-allergies] Fetching allergies for userId: ${userId}`);

    const { data, error } = await supabase
      .from('users')
      .select('allergies')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[GET /api/user-allergies] Error fetching allergies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch allergies' },
        { status: 500 }
      );
    }

    const allergies = data?.allergies || [];
    console.log('[GET /api/user-allergies] Fetched allergies:', allergies);

    return NextResponse.json({
      success: true,
      allergies,
    });
  } catch (error) {
    console.error('[GET /api/user-allergies] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, allergies } = body;

    console.log(`[PUT /api/user-allergies] Updating allergies for userId: ${userId}`, allergies);

    if (!userId || !Array.isArray(allergies)) {
      return NextResponse.json(
        { success: false, error: 'userId and allergies array are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('users')
      .update({ allergies })
      .eq('id', userId);

    if (error) {
      console.error('[PUT /api/user-allergies] Error updating allergies:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update allergies' },
        { status: 500 }
      );
    }

    console.log('[PUT /api/user-allergies] Successfully updated allergies');

    return NextResponse.json({
      success: true,
      message: 'Allergies updated successfully',
      allergies,
    });
  } catch (error) {
    console.error('[PUT /api/user-allergies] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
