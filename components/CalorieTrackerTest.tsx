"use client";

import { useState } from "react";
import { useCalorieTracker } from "./CalorieTracker";

interface CalorieTrackerTestProps {
  userId: number;
}

export default function CalorieTrackerTest({
  userId,
}: CalorieTrackerTestProps) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const { addCaloriesFromFood, addCaloriesFromDeal } =
    useCalorieTracker(userId);

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    addTestResult("🧪 Starting Calorie Tracker Tests...");

    try {
      // Test 1: Get current tracker data
      addTestResult("📊 Testing: Get current tracker data");
      const response1 = await fetch(`/api/calorie-tracker?userId=${userId}`);
      const result1 = await response1.json();

      if (result1.success) {
        addTestResult("✅ Get tracker data: SUCCESS");
        addTestResult(
          `   Current calories: ${result1.tracker.currentCalories}`,
        );
        addTestResult(`   Daily limit: ${result1.tracker.dailyLimit}`);
      } else {
        addTestResult("❌ Get tracker data: FAILED - " + result1.error);
      }

      // Test 2: Add food calories
      addTestResult("🍕 Testing: Add food calories (Pizza - 200 cal)");
      const testFood = {
        id: 999,
        name: "Test Pizza Slice",
        total_calories: 200,
        calories: 200,
      };

      const result3 = await addCaloriesFromFood(testFood);

      if (result3.success) {
        addTestResult("✅ Add food calories: SUCCESS");
        addTestResult(
          `   New total: ${result3.tracker.currentCalories} calories`,
        );

        if (result3.tracker.limitExceeded) {
          addTestResult("⚠️  Daily limit exceeded!");
        }
      } else {
        addTestResult("❌ Add food calories: FAILED - " + result3.error);
      }

      // Test 3: Update daily limit
      addTestResult("🎯 Testing: Update daily limit to 3000");
      const response4 = await fetch("/api/calorie-tracker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          dailyLimit: 3000,
        }),
      });

      const result4 = await response4.json();

      if (result4.success) {
        addTestResult("✅ Update daily limit: SUCCESS");
        addTestResult(`   New limit: ${result4.tracker.dailyLimit} calories`);
      } else {
        addTestResult("❌ Update daily limit: FAILED - " + result4.error);
      }

      // Test 4: Get calorie log
      addTestResult("📋 Testing: Get calorie log");
      const response5 = await fetch(
        `/api/calorie-tracker/log?userId=${userId}`,
      );
      const result5 = await response5.json();

      if (result5.success) {
        addTestResult("✅ Get calorie log: SUCCESS");
        addTestResult(`   Log entries: ${result5.log.length} items`);
      } else {
        addTestResult("❌ Get calorie log: FAILED - " + result5.error);
      }

      addTestResult("🎉 All tests completed!");
    } catch (error) {
      addTestResult("💥 Test suite failed: " + (error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          🧪 Calorie Tracker Test Suite
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runTests}
            disabled={testing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {testing ? "Running Tests..." : "Run Tests"}
          </button>
          <button
            onClick={clearResults}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Click "Run Tests" to test the calorie tracker functionality
          </div>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-sm font-mono ${
                  result.includes("✅")
                    ? "text-green-600"
                    : result.includes("❌")
                      ? "text-red-600"
                      : result.includes("⚠️")
                        ? "text-orange-600"
                        : result.includes("🎉")
                          ? "text-purple-600 font-bold"
                          : "text-gray-700"
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-700">
          <div className="font-semibold mb-1">💡 Test Information:</div>
          <div className="text-xs space-y-1">
            <div>• Tests all major calorie tracker functions</div>
            <div>• Adds test data to your tracker</div>
            <div>• Verifies API endpoints are working</div>
            <div>• Check the calorie tracker widget for real-time updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
