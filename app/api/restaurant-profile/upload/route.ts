import { NextRequest, NextResponse } from 'next/server';
import { AuthFactory } from '../../../../lib/auth/jwt-auth';
import { 
  RestaurantProfileInvoker, 
  RestaurantProfileCommandFactory 
} from '../../../../lib/commands/restaurant-profile-command';

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
    const { imageFile, imageFileName } = body;

    // Validation
    if (!imageFile || !imageFileName) {
      return NextResponse.json(
        { success: false, error: 'Image file and filename are required' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(authPayload.userId);

    console.log('Processing profile upload for restaurant:', restaurantId);

    // Use Command Pattern for profile picture upload
    const uploadCommand = RestaurantProfileCommandFactory.createUploadCommand(
      restaurantId,
      imageFile,
      imageFileName
    );

    const invoker = new RestaurantProfileInvoker();
    invoker.setCommand(uploadCommand);
    
    const result = await invoker.executeCommand();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Profile picture updated successfully',
        imageUrl: result.imageUrl
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in restaurant profile upload API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}