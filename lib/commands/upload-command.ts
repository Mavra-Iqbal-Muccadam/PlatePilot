// Command Pattern Implementation for Upload Operations

export interface Command {
  execute(): Promise<any>;
}

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ImageUploadCommand implements Command {
  private imageFile: string;
  private imageFileName: string;
  private authHeaders: { [key: string]: string };

  constructor(imageFile: string, imageFileName: string, authHeaders: { [key: string]: string }) {
    this.imageFile = imageFile;
    this.imageFileName = imageFileName;
    this.authHeaders = authHeaders;
  }

  async execute(): Promise<UploadResult> {
    try {
      console.log('Executing image upload command for:', this.imageFileName);

      // Use absolute URL for server-side fetch
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.replace('supabase.co', 'vercel.app') : 
        'http://localhost:3000';
      
      const uploadUrl = `${baseUrl}/api/upload-image`;
      console.log('Upload URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.authHeaders
        },
        body: JSON.stringify({
          imageFile: this.imageFile,
          imageFileName: this.imageFileName
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('Image upload successful:', result.imageUrl);
        return {
          success: true,
          imageUrl: result.imageUrl
        };
      } else {
        console.error('Image upload failed:', result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error executing upload command:', error);
      return {
        success: false,
        error: 'Failed to upload image'
      };
    }
  }
}

// Command Invoker
export class UploadInvoker {
  private commands: Command[] = [];

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  async executeCommands(): Promise<any[]> {
    const results = [];
    for (const command of this.commands) {
      const result = await command.execute();
      results.push(result);
    }
    this.commands = []; // Clear commands after execution
    return results;
  }
}

// Factory for creating upload commands
export class UploadCommandFactory {
  static createImageUploadCommand(
    imageFile: string, 
    imageFileName: string, 
    authHeaders: { [key: string]: string }
  ): ImageUploadCommand {
    return new ImageUploadCommand(imageFile, imageFileName, authHeaders);
  }
}