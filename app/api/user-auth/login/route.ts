import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('User login attempt:', { email, passwordLength: password?.length });

    // Simple validation
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Import supabase client
    const { supabase } = await import('../../../../lib/supabase');

    // First, check if user exists by email
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError) {
      console.log('User lookup error:', checkError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    if (!existingUser) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('User found:', { id: existingUser.id, username: existingUser.username, email: existingUser.email });

    // Check password
    if (existingUser.password !== password) {
      console.log('Password mismatch for user:', existingUser.username);
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Password match successful for user:', existingUser.username);

    // Simple token (just user ID for simplicity)
    const token = `user_${existingUser.id}_${Date.now()}`;

    console.log('Login successful, generating token for user:', existingUser.username);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        profile_image: existingUser.profile_image
      }
    });

  } catch (error) {
    console.error('Error in user login API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}