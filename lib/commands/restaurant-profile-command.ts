// Command Pattern for Restaurant Profile Picture Upload
export interface RestaurantProfileCommand {
  execute(): Promise<{ success: boolean; imageUrl?: string; error?: string }>;
}

export class UploadRestaurantProfileCommand implements RestaurantProfileCommand {
  private restaurantId: number;
  private imageFile: string;
  private imageFileName: string;

  constructor(restaurantId: number, imageFile: string, imageFileName: string) {
    this.restaurantId = restaurantId;
    this.imageFile = imageFile;
    this.imageFileName = imageFileName;
  }

  async execute(): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      console.log('Executing restaurant profile upload command for:', this.imageFileName);

      // Import supabase client
      const { supabase } = await import('../supabase');

      // Convert base64 to buffer
      const base64Data = this.imageFile.includes(',') ? this.imageFile.split(',')[1] : this.imageFile;
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate unique filename
      const fileExt = this.imageFileName.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueFileName = `restaurant_${this.restaurantId}_${Date.now()}.${fileExt}`;
      
      console.log('Uploading to restaurant_user bucket with path:', uniqueFileName);

      // Upload to restaurant_user bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant_user')
        .upload(uniqueFileName, buffer, {
          contentType: this.getContentType(fileExt),
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Supabase storage error:', uploadError);
        return { success: false, error: 'Failed to upload image' };
      }

      console.log('Upload successful:', uploadData);
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('restaurant_user')
        .getPublicUrl(uniqueFileName);

      const imageUrl = urlData.publicUrl;
      console.log('Generated public URL:', imageUrl);

      // Update restaurant_user table with profile_pic URL
      const { error: updateError } = await supabase
        .from('restaurant_user')
        .update({ profile_pic: imageUrl })
        .eq('id', this.restaurantId);

      if (updateError) {
        console.error('Database update error:', updateError);
        return { success: false, error: 'Failed to update profile picture' };
      }

      return { success: true, imageUrl };

    } catch (error) {
      console.error('Error executing restaurant profile upload command:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  private getContentType(fileExt: string): string {
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
}

// Command Invoker for Restaurant Profile Operations
export class RestaurantProfileInvoker {
  private command: RestaurantProfileCommand | null = null;

  setCommand(command: RestaurantProfileCommand): void {
    this.command = command;
  }

  async executeCommand(): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    if (!this.command) {
      return { success: false, error: 'No command set' };
    }
    return await this.command.execute();
  }
}

// Factory for creating restaurant profile commands
export class RestaurantProfileCommandFactory {
  static createUploadCommand(
    restaurantId: number,
    imageFile: string, 
    imageFileName: string
  ): UploadRestaurantProfileCommand {
    return new UploadRestaurantProfileCommand(restaurantId, imageFile, imageFileName);
  }
}