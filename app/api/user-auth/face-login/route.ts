import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Face recognition login is no longer supported. Please use email and password login.' },
    { status: 501 }
  );
}