import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from Authorization header or localStorage
    const authHeader = request.headers.get('authorization');
    let userId: number | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token.startsWith('user_')) {
        const rawUserId = token.split('_')[1];
        const parsedUserId = Number(rawUserId);
        if (Number.isFinite(parsedUserId) && parsedUserId > 0) {
          userId = parsedUserId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'user-pic';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      );
    }

    console.log('Processing image upload:', file.name, 'Size:', file.size);

    try {
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueFileName = `${userId}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading to', bucket, 'bucket with path:', uniqueFileName);
      console.log('Buffer size:', buffer.length);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(uniqueFileName, buffer, {
          contentType: getContentType(fileExt),
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage error:', error);
        return NextResponse.json(
          { success: false, error: `Upload failed: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uniqueFileName);

      console.log('Generated public URL:', urlData.publicUrl);

      // Update user profile_image in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_image: urlData.publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user profile:', updateError);
        // Don't fail the upload if database update fails
      }

      return NextResponse.json({
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName
      });

    } catch (uploadError) {
      console.error('Error during upload process:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to process and upload image' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in upload-image API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getContentType(fileExt: string): string {
  switch (fileExt.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}