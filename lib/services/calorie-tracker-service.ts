// CALORIE TRACKER SERVICE - Using Strategy and Observer Patterns
import { supabase } from "../supabase";

// Strategy Pattern for different calorie calculation methods
export interface CalorieCalculationStrategy {
  calculateCalories(item: any): number;
}

// Concrete strategies for different food sources
export class FoodCalorieStrategy implements CalorieCalculationStrategy {
  calculateCalories(food: any): number {
    return food.total_calories || food.calories || 0;
  }
}

export class DealCalorieStrategy implements CalorieCalculationStrategy {
  calculateCalories(deal: any): number {
    // Sum calories from all items in the deal
    if (deal.items && Array.isArray(deal.items)) {
      return deal.items.reduce((total: number, item: any) => {
        return total + (item.calories || 0) * (item.quantity || 1);
      }, 0);
    }
    return deal.total_calories || 0;
  }
}

// Observer Pattern for calorie limit notifications
export interface CalorieObserver {
  onCalorieAdded(data: CalorieUpdateData): void;
  onLimitExceeded(data: CalorieUpdateData): void;
  onLimitUpdated(data: CalorieUpdateData): void;
  onCaloriesReset(data: CalorieUpdateData): void;
}

export interface CalorieUpdateData {
  userId: number;
  currentCalories: number;
  dailyLimit: number;
  caloriesAdded?: number;
  limitExceeded: boolean;
  remainingCalories: number;
  foodName?: string;
}

// Main Calorie Tracker Service
export class CalorieTrackerService {
  private observers: CalorieObserver[] = [];
  private calculationStrategy: CalorieCalculationStrategy;

  constructor(
    strategy: CalorieCalculationStrategy = new FoodCalorieStrategy(),
  ) {
    this.calculationStrategy = strategy;
  }

  // Observer pattern methods
  addObserver(observer: CalorieObserver): void {
    this.observers.push(observer);
  }

  removeObserver(observer: CalorieObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  private notifyObservers(event: string, data: CalorieUpdateData): void {
    this.observers.forEach((observer) => {
      switch (event) {
        case "calorieAdded":
          observer.onCalorieAdded(data);
          break;
        case "limitExceeded":
          observer.onLimitExceeded(data);
          break;
        case "limitUpdated":
          observer.onLimitUpdated(data);
          break;
        case "caloriesReset":
          observer.onCaloriesReset(data);
          break;
      }
    });
  }

  // Strategy pattern method
  setCalculationStrategy(strategy: CalorieCalculationStrategy): void {
    this.calculationStrategy = strategy;
  }

  // Get current tracker data
  async getCurrentTracker(userId: number): Promise<{
    success: boolean;
    data?: CalorieUpdateData;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc(
        "get_or_create_daily_tracker",
        { p_user_id: userId },
      );

      if (error) {
        console.error("Error getting tracker:", error);
        return { success: false, error: error.message };
      }

      // Handle both JSON response and direct object response
      let trackerInfo;
      if (typeof data === "string") {
        trackerInfo = JSON.parse(data);
      } else if (data && typeof data === "object") {
        trackerInfo = data;
      } else {
        return { success: false, error: "Invalid tracker data format" };
      }

      const trackerData: CalorieUpdateData = {
        userId,
        currentCalories: trackerInfo.current_calories || 0,
        dailyLimit: trackerInfo.daily_limit || 2000,
        limitExceeded:
          (trackerInfo.current_calories || 0) >
          (trackerInfo.daily_limit || 2000),
        remainingCalories: Math.max(
          0,
          (trackerInfo.daily_limit || 2000) -
            (trackerInfo.current_calories || 0),
        ),
      };

      return { success: true, data: trackerData };
    } catch (error) {
      console.error("Error in getCurrentTracker:", error);
      return {
        success: false,
        error:
          "Failed to get tracker data: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
    }
  }

  // Add calories to tracker
  async addCalories(
    userId: number,
    item: any,
    sourceType: "food" | "deal",
    sourceId?: number,
    orderId?: number,
  ): Promise<{
    success: boolean;
    data?: CalorieUpdateData;
    error?: string;
  }> {
    try {
      // Calculate calories using current strategy
      const calories = this.calculationStrategy.calculateCalories(item);
      const foodName =
        item.name || item.food_name || item.deal_name || "Unknown Item";

      // Call database function
      const { data, error } = await supabase.rpc("add_calories_to_tracker", {
        p_user_id: userId,
        p_calories: calories,
        p_food_name: foodName,
        p_source_type: sourceType,
        p_source_id: sourceId || null,
        p_order_id: orderId || null,
      });

      if (error) {
        console.error("Error adding calories:", error);
        return { success: false, error: error.message };
      }

      const result = typeof data === "string" ? JSON.parse(data) : data;

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const updateData: CalorieUpdateData = {
        userId,
        currentCalories: result.current_calories,
        dailyLimit: result.daily_limit,
        caloriesAdded: result.calories_added,
        limitExceeded: result.limit_exceeded,
        remainingCalories: result.remaining_calories,
        foodName,
      };

      // Notify observers
      this.notifyObservers("calorieAdded", updateData);

      if (result.limit_exceeded) {
        this.notifyObservers("limitExceeded", updateData);
      }

      return { success: true, data: updateData };
    } catch (error) {
      console.error("Error in addCalories:", error);
      return { success: false, error: "Failed to add calories" };
    }
  }

  // Update daily limit
  async updateDailyLimit(
    userId: number,
    newLimit: number,
  ): Promise<{
    success: boolean;
    data?: CalorieUpdateData;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("update_daily_limit", {
        p_user_id: userId,
        p_new_limit: newLimit,
      });

      if (error) {
        console.error("Error updating limit:", error);
        return { success: false, error: error.message };
      }

      const result = typeof data === "string" ? JSON.parse(data) : data;

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const updateData: CalorieUpdateData = {
        userId,
        currentCalories: result.current_calories,
        dailyLimit: result.new_limit,
        limitExceeded: result.limit_exceeded,
        remainingCalories: Math.max(
          0,
          result.new_limit - result.current_calories,
        ),
      };

      // Notify observers
      this.notifyObservers("limitUpdated", updateData);

      return { success: true, data: updateData };
    } catch (error) {
      console.error("Error in updateDailyLimit:", error);
      return { success: false, error: "Failed to update daily limit" };
    }
  }

  // Reset daily calories
  async resetDailyCalories(userId: number): Promise<{
    success: boolean;
    data?: CalorieUpdateData;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("reset_daily_calories", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error resetting calories:", error);
        return { success: false, error: error.message };
      }

      const result = typeof data === "string" ? JSON.parse(data) : data;

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const updateData: CalorieUpdateData = {
        userId,
        currentCalories: result.current_calories,
        dailyLimit: result.daily_limit,
        limitExceeded: false,
        remainingCalories: result.daily_limit,
      };

      // Notify observers
      this.notifyObservers("caloriesReset", updateData);

      return { success: true, data: updateData };
    } catch (error) {
      console.error("Error in resetDailyCalories:", error);
      return { success: false, error: "Failed to reset calories" };
    }
  }

  // Get calorie log for a specific date
  async getCalorieLog(
    userId: number,
    date?: string,
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const targetDate = date || new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("calorie_log")
        .select("*")
        .eq("user_id", userId)
        .eq("date", targetDate)
        .order("logged_at", { ascending: false });

      if (error) {
        console.error("Error getting calorie log:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error("Error in getCalorieLog:", error);
      return { success: false, error: "Failed to get calorie log" };
    }
  }
}

// Factory for creating calorie tracker services
export class CalorieTrackerFactory {
  static createFoodTracker(): CalorieTrackerService {
    return new CalorieTrackerService(new FoodCalorieStrategy());
  }

  static createDealTracker(): CalorieTrackerService {
    return new CalorieTrackerService(new DealCalorieStrategy());
  }

  static createDefaultTracker(): CalorieTrackerService {
    return new CalorieTrackerService(new FoodCalorieStrategy());
  }
}

// Singleton instance for global use
export const globalCalorieTracker =
  CalorieTrackerFactory.createDefaultTracker();
