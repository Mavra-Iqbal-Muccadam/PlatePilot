import { NextRequest, NextResponse } from 'next/server';
import { FoodService } from '../../../lib/services/menu-item-service';
import { AuthFactory } from '../../../lib/auth/jwt-auth';

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

export async function POST(request: NextRequest) {
  try {
    // Authenticate request using JWT
    const authContext = AuthFactory.createJWTAuth();
    const authPayload = authContext.authenticateRequest(request);

    if (!authPayload) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Received request body for food creation');

    const { 
      dishName, 
      description, 
      price, 
      allergies, 
      ingredients, 
      imageFile, 
      imageFileName 
    } = body;

    // Use restaurant ID from JWT token
    const restaurantId = parseInt(authPayload.userId);

    console.log('Extracted fields:', {
      restaurantId,
      dishName,
      description,
      price,
      allergies: allergies?.length,
      ingredients: ingredients?.length,
      hasImageFile: !!imageFile,
      imageFileName
    });

    // Validation
    if (!dishName) {
      return NextResponse.json(
        { success: false, error: 'Dish name is required' },
        { status: 400 }
      );
    }

    if (!price && price !== 0) {
      return NextResponse.json(
        { success: false, error: 'Price is required' },
        { status: 400 }
      );
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    // Handle image upload directly
    let imageUrl: string | undefined;
    if (imageFile && imageFileName) {
      console.log('Processing image upload directly...');
      
      try {
        // Convert base64 to buffer
        const base64Data = imageFile.includes(',') ? imageFile.split(',')[1] : imageFile;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const fileExt = imageFileName.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueFileName = `${restaurantId}/${Date.now()}.${fileExt}`;
        
        console.log('Uploading to food-pic bucket with path:', uniqueFileName);

        // Upload directly to Supabase Storage using buffer
        const { supabase } = await import('../../../lib/supabase');
        const { data, error } = await supabase.storage
          .from('food-pic')
          .upload(uniqueFileName, buffer, {
            contentType: getContentType(fileExt),
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Supabase storage error:', error);
        } else {
          console.log('Upload successful:', data);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('food-pic')
            .getPublicUrl(uniqueFileName);

          imageUrl = urlData.publicUrl;
          console.log('Generated public URL:', imageUrl);
        }
      } catch (uploadError) {
        console.error('Error during upload process:', uploadError);
        // Continue without image rather than failing the entire request
      }
    }

    // Create food item using Unit of Work pattern
    const foodService = new FoodService();
    const result = await foodService.createFoodWithImageUrl(
      restaurantId,
      dishName,
      description || '',
      price,
      allergies || [],
      ingredients,
      imageUrl
    );

    console.log('Service result:', result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        foodId: result.foodId,
        message: 'Food item created successfully',
        imageUrl: imageUrl
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in create-food API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}