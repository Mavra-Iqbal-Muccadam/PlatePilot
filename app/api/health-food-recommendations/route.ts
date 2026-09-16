import { NextRequest, NextResponse } from 'next/server';

// Strategy Pattern for health calculations
interface HealthCalculationStrategy {
  calculateRecommendedCalories(weight: number, height: number, age: number, gender: 'male' | 'female', activityLevel: string): number;
  calculateBMI(weight: number, height: number): number;
  getBMICategory(bmi: number): string;
}

class StandardHealthCalculationStrategy implements HealthCalculationStrategy {
  calculateRecommendedCalories(weight: number, height: number, age: number, gender: 'male' | 'female', activityLevel: string): number {
    // Harris-Benedict Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Activity multipliers
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };

    return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
  }

  calculateBMI(weight: number, height: number): number {
    // BMI = weight(kg) / height(m)²
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
}

// Strategy Pattern for food filtering based on health goals
interface HealthFoodFilterStrategy {
  filterFoods(foods: any[], userProfile: UserHealthProfile, targetCalories: number): any[];
}

class WeightLossFoodFilterStrategy implements HealthFoodFilterStrategy {
  filterFoods(foods: any[], userProfile: UserHealthProfile, targetCalories: number): any[] {
    // Prioritize low-calorie, high-protein foods
    return foods
      .filter(food => food.total_calories <= targetCalories * 0.3) // Max 30% of daily calories per meal
      .sort((a, b) => {
        // Prioritize by protein content and lower calories
        const aScore = (a.protein_content || 0) - (a.total_calories * 0.1);
        const bScore = (b.protein_content || 0) - (b.total_calories * 0.1);
        return bScore - aScore;
      })
      .slice(0, 10);
  }
}

class WeightGainFoodFilterStrategy implements HealthFoodFilterStrategy {
  filterFoods(foods: any[], userProfile: UserHealthProfile, targetCalories: number): any[] {
    // Prioritize high-calorie, nutrient-dense foods
    return foods
      .filter(food => food.total_calories >= targetCalories * 0.2) // At least 20% of daily calories
      .sort((a, b) => b.total_calories - a.total_calories)
      .slice(0, 10);
  }
}

class MaintenanceFoodFilterStrategy implements HealthFoodFilterStrategy {
  filterFoods(foods: any[], userProfile: UserHealthProfile, targetCalories: number): any[] {
    // Balanced approach - moderate calories
    return foods
      .filter(food => 
        food.total_calories >= targetCalories * 0.15 && 
        food.total_calories <= targetCalories * 0.35
      )
      .sort((a, b) => {
        // Balance calories and nutritional value
        const aScore = a.total_calories + (a.protein_content || 0) * 2;
        const bScore = b.total_calories + (b.protein_content || 0) * 2;
        return Math.abs(bScore - targetCalories * 0.25) - Math.abs(aScore - targetCalories * 0.25);
      })
      .slice(0, 10);
  }
}

// Factory Pattern for creating health strategies
class HealthStrategyFactory {
  static createHealthCalculationStrategy(): HealthCalculationStrategy {
    return new StandardHealthCalculationStrategy();
  }

  static createFoodFilterStrategy(goal: string): HealthFoodFilterStrategy {
    switch (goal.toLowerCase()) {
      case 'weight_loss':
      case 'lose_weight':
        return new WeightLossFoodFilterStrategy();
      case 'weight_gain':
      case 'gain_weight':
        return new WeightGainFoodFilterStrategy();
      case 'maintenance':
      case 'maintain_weight':
      default:
        return new MaintenanceFoodFilterStrategy();
    }
  }
}

// Command Pattern for health analysis
interface HealthAnalysisCommand {
  execute(): HealthAnalysisResult;
}

interface UserHealthProfile {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: string;
  healthGoal: string;
  targetCalories?: number;
  dietaryRestrictions?: string[];
}

interface HealthAnalysisResult {
  bmi: number;
  bmiCategory: string;
  recommendedCalories: number;
  healthStatus: string;
  recommendations: string[];
}

class HealthAnalysisCommand implements HealthAnalysisCommand {
  constructor(
    private userProfile: UserHealthProfile,
    private healthStrategy: HealthCalculationStrategy
  ) {}

  execute(): HealthAnalysisResult {
    const bmi = this.healthStrategy.calculateBMI(this.userProfile.weight, this.userProfile.height);
    const bmiCategory = this.healthStrategy.getBMICategory(bmi);
    const recommendedCalories = this.healthStrategy.calculateRecommendedCalories(
      this.userProfile.weight,
      this.userProfile.height,
      this.userProfile.age,
      this.userProfile.gender,
      this.userProfile.activityLevel
    );

    const recommendations = this.generateRecommendations(bmi, bmiCategory, this.userProfile.healthGoal);
    const healthStatus = this.getHealthStatus(bmi, bmiCategory);

    return {
      bmi,
      bmiCategory,
      recommendedCalories,
      healthStatus,
      recommendations
    };
  }

  private generateRecommendations(bmi: number, bmiCategory: string, goal: string): string[] {
    const recommendations: string[] = [];

    if (bmiCategory === 'Underweight') {
      recommendations.push('Focus on nutrient-dense, high-calorie foods');
      recommendations.push('Include healthy fats like nuts, avocados, and olive oil');
      recommendations.push('Consider protein-rich foods for muscle building');
    } else if (bmiCategory === 'Overweight' || bmiCategory === 'Obese') {
      recommendations.push('Choose low-calorie, high-fiber foods');
      recommendations.push('Prioritize lean proteins and vegetables');
      recommendations.push('Limit processed and high-sugar foods');
    } else {
      recommendations.push('Maintain a balanced diet with variety');
      recommendations.push('Include all food groups in moderation');
      recommendations.push('Stay hydrated and active');
    }

    if (goal.includes('weight_loss')) {
      recommendations.push('Create a moderate calorie deficit');
      recommendations.push('Focus on portion control');
    } else if (goal.includes('weight_gain')) {
      recommendations.push('Eat frequent, nutrient-dense meals');
      recommendations.push('Include healthy snacks between meals');
    }

    return recommendations;
  }

  private getHealthStatus(bmi: number, bmiCategory: string): string {
    if (bmiCategory === 'Normal weight') {
      return 'You have a healthy BMI. Keep up the good work!';
    } else if (bmiCategory === 'Underweight') {
      return 'Your BMI indicates you may be underweight. Consider consulting a healthcare provider.';
    } else if (bmiCategory === 'Overweight') {
      return 'Your BMI indicates you may be overweight. A balanced diet and exercise can help.';
    } else {
      return 'Your BMI indicates obesity. Please consider consulting a healthcare provider for guidance.';
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      weight, 
      height, 
      age, 
      gender, 
      activityLevel = 'moderate', 
      healthGoal = 'maintenance',
      targetCalories,
      dietaryRestrictions = []
    } = body;

    // Validate required fields
    if (!weight || !height || !age || !gender) {
      return NextResponse.json(
        { success: false, error: 'Weight, height, age, and gender are required' },
        { status: 400 }
      );
    }

    // Create user health profile
    const userProfile: UserHealthProfile = {
      weight: parseFloat(weight),
      height: parseFloat(height),
      age: parseInt(age),
      gender,
      activityLevel,
      healthGoal,
      targetCalories: targetCalories ? parseFloat(targetCalories) : undefined,
      dietaryRestrictions
    };

    // Use Strategy Pattern for health calculations
    const healthStrategy = HealthStrategyFactory.createHealthCalculationStrategy();
    
    // Use Command Pattern for health analysis
    const healthAnalysisCommand = new HealthAnalysisCommand(userProfile, healthStrategy);
    const healthAnalysis = healthAnalysisCommand.execute();

    // Fetch foods from database
    const { supabase } = await import('../../../lib/supabase');
    const { data: foods, error: foodError } = await supabase
      .from('food')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        allergies,
        restaurant_user (
          id,
          name,
          profile_pic
        ),
        food_details (
          ingredient_name,
          calories_count
        )
      `)
      .eq('enabled', true);

    if (foodError) {
      console.error('Database error:', foodError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch food data' },
        { status: 500 }
      );
    }

    // Transform and calculate total calories for each food
    const transformedFoods = (foods || []).map(food => ({
      ...food,
      total_calories: food.food_details?.reduce((sum: number, detail: any) => 
        sum + (detail.calories_count || 0), 0) || 0,
      protein_content: Math.floor(Math.random() * 30) + 5 // Simulated protein content
    }));

    // Use Strategy Pattern for food filtering
    const foodFilterStrategy = HealthStrategyFactory.createFoodFilterStrategy(healthGoal);
    const recommendedFoods = foodFilterStrategy.filterFoods(
      transformedFoods, 
      userProfile, 
      targetCalories || healthAnalysis.recommendedCalories
    );

    // Use AI to generate personalized recommendations
    const aiRecommendations = await generateAIRecommendations(userProfile, healthAnalysis, recommendedFoods);

    return NextResponse.json({
      success: true,
      healthAnalysis,
      recommendedFoods: recommendedFoods.map(food => {
        const ru = Array.isArray(food.restaurant_user)
          ? food.restaurant_user[0] as { id: any; name: any; profile_pic: any } | undefined
          : food.restaurant_user as { id: any; name: any; profile_pic: any } | null;
        return {
          id: food.id,
          name: food.name,
          description: food.description,
          price: parseFloat(food.price.toString()),
          image_url: food.image_url,
          total_calories: food.total_calories,
          protein_content: food.protein_content,
          restaurant: {
            id: ru?.id,
            name: ru?.name,
            profile_pic: ru?.profile_pic
          },
          suitability_score: Math.floor(Math.random() * 30) + 70 // Simulated suitability score
        };
      }),
      aiRecommendations,
      userProfile: {
        ...userProfile,
        calculatedCalories: healthAnalysis.recommendedCalories
      }
    });

  } catch (error) {
    console.error('Error in health food recommendations API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}

async function generateAIRecommendations(
  userProfile: UserHealthProfile, 
  healthAnalysis: HealthAnalysisResult, 
  foods: any[]
): Promise<string> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct",
        messages: [
          {
            role: "system",
            content: `You are a professional nutritionist and health advisor. Provide personalized food recommendations based on user's health profile and available foods.`
          },
          {
            role: "user",
            content: `
User Profile:
- Weight: ${userProfile.weight}kg
- Height: ${userProfile.height}cm  
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Activity Level: ${userProfile.activityLevel}
- Health Goal: ${userProfile.healthGoal}

Health Analysis:
- BMI: ${healthAnalysis.bmi} (${healthAnalysis.bmiCategory})
- Recommended Daily Calories: ${healthAnalysis.recommendedCalories}
- Health Status: ${healthAnalysis.healthStatus}

Available Foods: ${foods.map(f => `${f.name} (${f.total_calories} cal)`).join(', ')}

Please provide personalized recommendations for this user in 2-3 sentences, focusing on their health goals and the available food options.`
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Based on your profile, focus on balanced nutrition that aligns with your health goals.';
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return 'Based on your profile, focus on balanced nutrition that aligns with your health goals.';
  }
}