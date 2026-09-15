import { NextRequest, NextResponse } from "next/server";

function buildFallbackDietPlan(input: {
  age?: number;
  weight?: number;
  profession?: string;
  allergiesText: string;
  currentCalories: number;
  dailyLimit: number;
  calorieDeficit: number;
}) {
  const {
    age,
    weight,
    profession,
    allergiesText,
    currentCalories,
    dailyLimit,
    calorieDeficit,
  } = input;

  return `## 1. PERSONAL INFORMATION
- Age: ${age || "Not specified"} years
- Weight: ${weight || "Not specified"} kg
- Profession/Activity Level: ${profession || "Not specified"}
- Goal: Calorie management and healthy eating

## 2. DAILY CALORIE REQUIREMENT
- Daily Calorie Target: ${dailyLimit} calories
- Current Calorie Intake: ${currentCalories} calories
- Remaining Calorie Budget: ${calorieDeficit} calories
- Recommendation: Keep meals balanced and stay within your remaining calorie budget.

## 3. DIETARY RESTRICTIONS
- Allergies to Avoid: ${allergiesText}
- Foods to Completely Avoid: Any ingredient that triggers the listed allergies
- Special Dietary Preferences: Focus on simple, fresh, home-style meals

## 4. NUTRITION GOALS
- Protein Target: 25-30% of calories
- Carbohydrate Target: 45-50% of calories
- Fat Target: 20-25% of calories
- Water Intake Goal: 8-10 glasses (2-3 liters) per day

## 5. MEAL PLAN
### Breakfast (300-400 calories)
- Oats with fruit and nuts
- Estimated Calories: 350
- Image URL: https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=1200&q=80

### Mid-Morning Snack (100-150 calories)
- Apple with a handful of almonds
- Estimated Calories: 120
- Image URL: https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=1200&q=80

### Lunch (400-500 calories)
- Grilled chicken, brown rice, and vegetables
- Estimated Calories: 450
- Image URL: https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80

### Evening Snack (100-150 calories)
- Yogurt with seeds or a small fruit bowl
- Estimated Calories: 130
- Image URL: https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80

### Dinner (400-500 calories)
- Baked fish with vegetables and salad
- Estimated Calories: 450
- Image URL: https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80

## 6. PORTION SIZES
- Protein Portion: 1 palm-sized serving
- Carbohydrate Portion: 1 cupped-hand serving
- Vegetable Portion: 2 cups
- Healthy Fat Portion: 1 thumb-sized serving
- Serving Guidance: Use smaller plates and avoid second servings unless needed

## 7. RECOMMENDED FOODS
### High-Protein Foods:
- Eggs
- Chicken breast
- Fish
- Lentils
- Greek yogurt
- Tofu

### Healthy Carbohydrates:
- Brown rice
- Oats
- Whole wheat roti
- Sweet potato
- Quinoa
- Whole grain bread

### Healthy Fats:
- Avocado
- Nuts
- Seeds
- Olive oil
- Peanut butter
- Chia seeds

### Fiber-Rich Foods:
- Vegetables
- Fruits
- Lentils
- Beans
- Oats
- Whole grains

## 8. FOODS TO AVOID
- Allergy-Trigger Foods: ${allergiesText}
- Processed Foods to Limit: Chips, fried snacks, sugary drinks
- High-Sugar Foods to Avoid: Cakes, desserts, candy, soda
- Other Recommendations: Prefer fresh, minimally processed meals

## 9. HYDRATION PLAN
- Daily Water Intake: 8-10 glasses (2-3 liters)
- Best Hydration Timings:
  - Morning: 1 glass upon waking
  - Before Meals: 1 glass 30 minutes before eating
  - During Meals: Small sips
  - Evening: 1 glass before bed
- Hydration Tips: Carry a bottle and sip regularly throughout the day

## 10. LIFESTYLE TIPS
- Meal Timing: Eat at regular intervals and avoid skipping meals
- Sleep Recommendations: 7-9 hours per night
- Activity Suggestions: Light walking or stretching after meals
- Stress Management: Eat mindfully and keep meal choices simple

## 11. WEEKLY PROGRESS TIPS
- Weight Tracking: Weigh once a week at the same time
- Calorie Tracking: Log meals daily for consistency
- Consistency Advice: Aim for steady progress, not perfection
- Weekly Check-in: Review energy, hunger, and meal balance

## 12. IMPORTANT HEALTH NOTES
- Medical Disclaimer: This diet plan is for general guidance. Consult a healthcare professional before making significant dietary changes.
- Special Considerations: Adjust portions based on hunger, activity, and allergies
- When to Seek Professional Help: If you have a medical condition or ongoing dietary concerns, consult a nutritionist`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      age,
      weight,
      allergies,
      profession,
      currentCalories,
      dailyLimit,
    } = body;

    console.log("[generate-diet-plan] Generating diet plan with:", {
      userId,
      age,
      weight,
      allergies,
      profession,
      currentCalories,
      dailyLimit,
    });

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    // Build the prompt for Qwen
    const allergiesText =
      allergies && allergies.length > 0 ? allergies.join(", ") : "None";
    const calorieDeficit = dailyLimit - currentCalories;

    const prompt = `You are a professional nutritionist and diet planner. Create a comprehensive, structured personalized diet plan using the exact format below.

**USER PROFILE:**
- Age: ${age || "Not specified"} years
- Weight: ${weight || "Not specified"} kg
- Profession/Activity Level: ${profession || "Not specified"}
- Allergies: ${allergiesText}
- Daily Calorie Limit: ${dailyLimit} calories
- Current Calorie Intake: ${currentCalories} calories
- Remaining Budget: ${calorieDeficit} calories

**IMPORTANT: Format your response EXACTLY as follows with these section headings:**

## 1. PERSONAL INFORMATION
- Age: ${age || "Not specified"} years
- Weight: ${weight || "Not specified"} kg
- Profession/Activity Level: ${profession || "Not specified"}
- Goal: Calorie management and healthy eating

## 2. DAILY CALORIE REQUIREMENT
- Daily Calorie Target: ${dailyLimit} calories
- Current Calorie Intake: ${currentCalories} calories
- Remaining Calorie Budget: ${calorieDeficit} calories
- Recommendation: [Provide specific guidance based on their situation]

## 3. DIETARY RESTRICTIONS
- Allergies to Avoid: ${allergiesText}
- Foods to Completely Avoid: [List specific foods based on allergies]
- Special Dietary Preferences: [Any recommendations based on profession]

## 4. NUTRITION GOALS
- Protein Target: [X]g per day (25-30% of calories)
- Carbohydrate Target: [X]g per day (45-50% of calories)
- Fat Target: [X]g per day (20-25% of calories)
- Water Intake Goal: 8-10 glasses (2-3 liters) per day

## 5. MEAL PLAN
### Breakfast (300-400 calories)
- [Specific meal with ingredients and portions]
- Estimated Calories: [X]
- Image URL: [Provide a realistic Unsplash or Pexels image URL of this breakfast dish]

### Mid-Morning Snack (100-150 calories)
- [Specific snack with portions]
- Estimated Calories: [X]
- Image URL: [Provide a realistic Unsplash or Pexels image URL of this snack]

### Lunch (400-500 calories)
- [Specific meal with ingredients and portions]
- Estimated Calories: [X]
- Image URL: [Provide a realistic Unsplash or Pexels image URL of this lunch dish]

### Evening Snack (100-150 calories)
- [Specific snack with portions]
- Estimated Calories: [X]
- Image URL: [Provide a realistic Unsplash or Pexels image URL of this snack]

### Dinner (400-500 calories)
- [Specific meal with ingredients and portions]
- Estimated Calories: [X]
- Image URL: [Provide a realistic Unsplash or Pexels image URL of this dinner dish]

## 6. PORTION SIZES
- Protein Portion: [X]g or [X] serving
- Carbohydrate Portion: [X]g or [X] serving
- Vegetable Portion: [X] cups
- Healthy Fat Portion: [X]g or [X] serving
- Serving Guidance: [Practical tips for measuring portions]

## 7. RECOMMENDED FOODS
### High-Protein Foods:
- [List 5-6 options suitable for their allergies]

### Healthy Carbohydrates:
- [List 5-6 options]

### Healthy Fats:
- [List 5-6 options]

### Fiber-Rich Foods:
- [List 5-6 options]

## 8. FOODS TO AVOID
- Allergy-Trigger Foods: ${allergiesText}
- Processed Foods to Limit: [List specific items]
- High-Sugar Foods to Avoid: [List specific items]
- Other Recommendations: [Based on their profile]

## 9. HYDRATION PLAN
- Daily Water Intake: 8-10 glasses (2-3 liters)
- Best Hydration Timings:
  - Morning: 1 glass upon waking
  - Before Meals: 1 glass 30 minutes before eating
  - During Meals: Small sips
  - Evening: 1 glass before bed
- Hydration Tips: [Practical advice]

## 10. LIFESTYLE TIPS
- Meal Timing: [Specific recommendations based on profession]
- Sleep Recommendations: 7-9 hours per night
- Activity Suggestions: [Based on their profession and calorie goals]
- Stress Management: [Brief tips]

## 11. WEEKLY PROGRESS TIPS
- Weight Tracking: [How often and when to weigh]
- Calorie Tracking: [Practical advice for tracking]
- Consistency Advice: [Motivational tips for adherence]
- Weekly Check-in: [What to monitor]

## 12. IMPORTANT HEALTH NOTES
- Medical Disclaimer: This diet plan is for general guidance. Consult a healthcare professional before making significant dietary changes.
- Special Considerations: [Any specific notes based on their allergies or profession]
- When to Seek Professional Help: [Guidance on consulting a nutritionist]

**IMPORTANT REQUIREMENTS:**
1. Use EXACTLY these section headings as shown above
2. Provide specific, actionable recommendations
3. Ensure ALL meals and foods avoid the listed allergies completely
4. Make recommendations suitable for their profession and lifestyle
5. Keep calorie counts realistic and within the daily limit
6. Provide practical, easy-to-follow guidance
7. Use clear formatting with bullet points and sub-sections
8. Make it personalized and achievable
9. **FOR EACH MEAL, INCLUDE A REAL IMAGE URL** from Unsplash (https://images.unsplash.com/) or Pexels (https://images.pexels.com/) that shows the actual dish
10. Image URLs must be valid and accessible
11. Choose images that match the meal description exactly`;

    console.log("[generate-diet-plan] Calling Qwen model...");

    const fallbackDietPlan = buildFallbackDietPlan({
      age,
      weight,
      profession,
      allergiesText,
      currentCalories: Number(currentCalories) || 0,
      dailyLimit: Number(dailyLimit) || 2000,
      calorieDeficit: Number(calorieDeficit) || 0,
    });

    // Call Qwen model via OpenRouter, but fall back to a local plan if the provider fails.
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn(
        "[generate-diet-plan] OPENROUTER_API_KEY missing, returning fallback diet plan",
      );
      return NextResponse.json({
        success: true,
        dietPlan: fallbackDietPlan,
        source: "fallback",
        userProfile: {
          age,
          weight,
          profession,
          allergies,
          currentCalories,
          dailyLimit,
        },
      });
    }

    let dietPlan = "";
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "qwen/qwen-2.5-72b-instruct",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        },
      );

      console.log(
        "[generate-diet-plan] Qwen response status:",
        response.status,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[generate-diet-plan] Qwen API error:", errorData);
        dietPlan = fallbackDietPlan;
      } else {
        const data = await response.json();
        console.log("[generate-diet-plan] Qwen response received");

        // Extract the diet plan from response
        dietPlan =
          data?.choices?.[0]?.message?.content ||
          data?.choices?.[0]?.text ||
          data?.message?.content ||
          data?.output_text ||
          data?.content ||
          "";

        if (!dietPlan) {
          console.error("[generate-diet-plan] No content in response", data);
          dietPlan = fallbackDietPlan;
        }
      }
    } catch (providerError) {
      console.error(
        "[generate-diet-plan] Provider error, using fallback plan:",
        providerError,
      );
      dietPlan = fallbackDietPlan;
    }

    console.log("[generate-diet-plan] Diet plan generated successfully");

    return NextResponse.json({
      success: true,
      dietPlan,
      source: dietPlan === fallbackDietPlan ? "fallback" : "qwen",
      userProfile: {
        age,
        weight,
        profession,
        allergies,
        currentCalories,
        dailyLimit,
      },
    });
  } catch (error) {
    console.error("[generate-diet-plan] Exception:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
