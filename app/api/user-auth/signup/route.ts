import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, profileImage } = body;

    // Simple validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Import supabase client
    const { supabase } = await import('../../../../lib/supabase');

    // Check if user already exists (more robust check)
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, username, email')
      .or(`email.eq.${email},username.eq.${username}`);

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return NextResponse.json(
        { success: false, error: 'Database error while checking existing users' },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      let errorMessage = 'User already exists: ';
      if (existingUser.email === email) {
        errorMessage += 'Email is already registered';
      } else if (existingUser.username === username) {
        errorMessage += 'Username is already taken';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 409 }
      );
    }

    // Handle profile image upload if provided
    let imageUrl: string | null = null;
    if (profileImage) {
      try {
        // Convert base64 to buffer
        const base64Data = profileImage.includes(',') ? profileImage.split(',')[1] : profileImage;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const uniqueFileName = `${Date.now()}-${username}.jpg`;
        
        // Upload to user-pic bucket (with hyphen)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-pic')
          .upload(uniqueFileName, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError && uploadData) {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('user-pic')
            .getPublicUrl(uniqueFileName);

          imageUrl = urlData.publicUrl;
          console.log('Profile image uploaded successfully:', imageUrl);
        } else {
          console.error('Upload error:', uploadError);
        }
      } catch (uploadError) {
        console.error('Error uploading profile image:', uploadError);
      }
    }



    // Create user (store password as plain text for simplicity)
    const userData = {
      username,
      email,
      password, // Plain text password for simplicity
      profile_image: imageUrl
    };

    console.log('Attempting to create user with data:', {
      username: userData.username,
      email: userData.email,
      profile_image: userData.profile_image ? 'Present' : 'None'
    });

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(userData)
      .select('id, username, email, profile_image')
      .single();

    if (createError) {
      console.error('Database error:', createError);
      
      // Handle specific database errors
      let errorMessage = 'Failed to create user account';
      if (createError.code === '23505') {
        if (createError.message.includes('username')) {
          errorMessage = 'Username is already taken';
        } else if (createError.message.includes('email')) {
          errorMessage = 'Email is already registered';
        } else {
          errorMessage = 'User with this information already exists';
        }
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }

    console.log('User created successfully:', {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      profile_image: newUser.profile_image ? 'Present' : 'None'
    });

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      user: newUser
    });

  } catch (error) {
    console.error('Error in user signup API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}