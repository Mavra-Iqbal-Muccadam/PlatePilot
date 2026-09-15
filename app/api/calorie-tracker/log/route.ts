import { NextRequest, NextResponse } from "next/server";
import { CalorieTrackerFactory } from "../../../../lib/services/calorie-tracker-service";

// POST - Manually add calories to tracker (for testing or manual entries)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      calories,
      foodName,
      sourceType = "food",
      sourceId,
      orderId,
    } = body;

    if (!userId || !calories || !foodName) {
      return NextResponse.json(
        {
          success: false,
          error: "userId, calories, and foodName are required",
        },
        { status: 400 },
      );
    }

    if (calories <= 0 || calories > 5000) {
      return NextResponse.json(
        { success: false, error: "Calories must be between 1 and 5000" },
        { status: 400 },
      );
    }

    const tracker = CalorieTrackerFactory.createDefaultTracker();
    const item = {
      name: foodName,
      calories: parseInt(calories),
    };

    const result = await tracker.addCalories(
      parseInt(userId),
      item,
      sourceType,
      sourceId ? parseInt(sourceId) : undefined,
      orderId ? parseInt(orderId) : undefined,
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        tracker: result.data,
        message: result.data?.limitExceeded
          ? "Calories added but daily limit exceeded!"
          : "Calories added successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in manual calorie log:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Get calorie log for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date"); // Optional, defaults to today

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const tracker = CalorieTrackerFactory.createDefaultTracker();
    const result = await tracker.getCalorieLog(
      parseInt(userId),
      date || undefined,
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        log: result.data,
        date: date || new Date().toISOString().split("T")[0],
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in calorie log GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
