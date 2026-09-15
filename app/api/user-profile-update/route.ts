import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, age, weight, profession } = body;

    console.log(`[PUT /api/user-profile-update] Updating profile for userId: ${userId}`, { age, weight, profession });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (age !== undefined) updateData.age = age;
    if (weight !== undefined) updateData.weight = weight;
    if (profession !== undefined) updateData.profession = profession;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('[PUT /api/user-profile-update] Error updating profile:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Fetch updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, profile_image, age, weight, profession')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[PUT /api/user-profile-update] Error fetching updated profile:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    console.log('[PUT /api/user-profile-update] Successfully updated profile');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('[PUT /api/user-profile-update] Exception:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
