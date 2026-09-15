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

    console.log(`[GET /api/user-profile] Fetching profile for userId: ${userId}`);

    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, profile_image, age, weight, profession')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[GET /api/user-profile] Error fetching profile:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    console.log('[GET /api/user-profile] Profile fetched successfully');

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error('[GET /api/user-profile] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
