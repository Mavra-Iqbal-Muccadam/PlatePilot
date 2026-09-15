import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { AuthFactory } from '../../../../lib/auth/jwt-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user with database
    const { data: user, error } = await supabase
      .from('restaurant_user')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token using Strategy Pattern
    const authContext = AuthFactory.createJWTAuth();
    const token = authContext.generateToken({
      userId: user.id.toString(),
      email: user.email,
      restaurantName: user.name,
      registrationNumber: user.registration_number
    });

    // Return success with token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        registration_number: user.registration_number
      }
    });

  } catch (error) {
    console.error('Error in login API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}