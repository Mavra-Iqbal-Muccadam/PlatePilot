// Command Pattern for PDF Generation using Browser Print
export interface PDFCommand {
  execute(): Promise<void>;
}

// Concrete Command for Recipe PDF Generation using Print
export class GenerateRecipePDFCommand implements PDFCommand {
  private dishData: {
    name: string;
    description: string;
    ingredients: Array<{ ingredient_name: string; calories_count: number; count: number }>;
    recipe: string;
    allergies: string[];
    totalCalories: number;
  };

  constructor(dishData: any) {
    this.dishData = dishData;
  }

  async execute(): Promise<void> {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Unable to open print window');
      }

      // Generate HTML content for PDF
      const htmlContent = this.generatePrintableHTML();
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  private generatePrintableHTML(): string {
    const steps = this.dishData.recipe.split(/\d+\.|\n/).filter(step => step.trim().length > 0);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.dishData.name} - Recipe</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            color: #dc2626;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .description {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            color: #dc2626;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 2px solid #fecaca;
            padding-bottom: 5px;
          }
          .ingredient-item {
            background: #fef2f2;
            padding: 8px 12px;
            margin: 5px 0;
            border-left: 4px solid #dc2626;
            border-radius: 4px;
          }
          .allergen-tag {
            display: inline-block;
            background: #fee2e2;
            color: #991b1b;
            padding: 4px 12px;
            margin: 4px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .recipe-step {
            background: #f0fdf4;
            padding: 12px;
            margin: 10px 0;
            border-left: 4px solid #16a34a;
            border-radius: 4px;
          }
          .step-number {
            color: #16a34a;
            font-weight: bold;
            margin-right: 8px;
          }
          .stats {
            background: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${this.dishData.name}</div>
          <div class="description">${this.dishData.description}</div>
        </div>

        <div class="stats">
          <strong>Total Calories: ${this.dishData.totalCalories}</strong> | 
          <strong>Ingredients: ${this.dishData.ingredients.length}</strong> | 
          <strong>Allergens: ${this.dishData.allergies.length}</strong>
        </div>

        <div class="section">
          <div class="section-title">Ingredients</div>
          ${this.dishData.ingredients.map(ingredient => `
            <div class="ingredient-item">
              <strong>${ingredient.ingredient_name}</strong> - 
              ${ingredient.calories_count} cal × ${ingredient.count} = 
              <strong>${ingredient.calories_count * ingredient.count} cal</strong>
            </div>
          `).join('')}
        </div>

        ${this.dishData.allergies.length > 0 ? `
        <div class="section">
          <div class="section-title">Potential Allergens</div>
          ${this.dishData.allergies.map(allergy => `
            <span class="allergen-tag">${allergy}</span>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Cooking Instructions</div>
          ${steps.map((step, index) => `
            <div class="recipe-step">
              <span class="step-number">${index + 1}.</span>
              ${step.trim()}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Generated by AI Recipe Generator<br>
          ${new Date().toLocaleDateString()}
        </div>
      </body>
      </html>
    `;
  }
}

// Invoker class for PDF commands
export class PDFCommandInvoker {
  private command: PDFCommand | null = null;

  setCommand(command: PDFCommand): void {
    this.command = command;
  }

  async executeCommand(): Promise<void> {
    if (!this.command) {
      throw new Error('No command set');
    }
    await this.command.execute();
  }
}

// Factory for creating PDF commands
export class PDFCommandFactory {
  static createRecipePDFCommand(dishData: any): GenerateRecipePDFCommand {
    return new GenerateRecipePDFCommand(dishData);
  }
}