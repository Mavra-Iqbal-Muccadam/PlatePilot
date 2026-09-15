// Command Pattern for Healthy Menu Data Transfer

export interface MenuDataCommand {
  execute(): void;
}

export interface HealthyMenuData {
  dishName: string;
  description: string;
  ingredients: Array<{ name: string; calories: number }>;
  allergies: string[];
  totalCalories: number;
}

// Concrete Command for transferring healthy dish data to menu
export class HealthyMenuTransferCommand implements MenuDataCommand {
  private healthyData: HealthyMenuData;

  constructor(healthyData: HealthyMenuData) {
    this.healthyData = healthyData;
  }

  execute(): void {
    // Store the healthy dish data for autofill in add-food page
    localStorage.setItem('recipeDataForMenu', JSON.stringify(this.healthyData));
  }
}

// Command Invoker
export class MenuCommandInvoker {
  private command: MenuDataCommand | null = null;

  setCommand(command: MenuDataCommand): void {
    this.command = command;
  }

  executeCommand(): void {
    if (this.command) {
      this.command.execute();
    }
  }
}

// Factory for creating menu commands
export class MenuCommandFactory {
  static createHealthyMenuTransferCommand(
    healthyDishName: string,
    healthyDescription: string,
    healthyIngredients: Array<{ original: string; healthy: string; reason: string; calories: number }>,
    allergies: string[]
  ): HealthyMenuTransferCommand {
    
    // Transform healthy ingredients to menu format
    const menuIngredients = healthyIngredients.map(ing => ({
      name: ing.healthy, // Use the healthy substitute
      calories: ing.calories
    }));

    // Calculate total calories
    const totalCalories = menuIngredients.reduce((sum, ing) => sum + ing.calories, 0);

    const healthyMenuData: HealthyMenuData = {
      dishName: healthyDishName,
      description: healthyDescription,
      ingredients: menuIngredients,
      allergies: allergies,
      totalCalories: totalCalories
    };

    return new HealthyMenuTransferCommand(healthyMenuData);
  }
}