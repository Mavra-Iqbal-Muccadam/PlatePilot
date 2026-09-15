"use client";

import { useState, useEffect } from "react";
import CalorieTracker from "../../components/CalorieTracker";
import CalorieTrackerTest from "../../components/CalorieTrackerTest";

export default function CalorieTestPage() {
  const [userId, setUserId] = useState<number>(1); // Default test user ID
  const [userIdInput, setUserIdInput] = useState("1");

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          🔥 Calorie Tracker Test Page
        </h1>

        {/* User ID Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="flex items-center gap-4">
            <label className="font-medium">User ID:</label>
            <input
              type="number"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-32"
            />
            <button
              onClick={() => setUserId(parseInt(userIdInput) || 1)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Update User ID
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current User ID: <strong>{userId}</strong>
          </p>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Test</h2>
          <CalorieTrackerTest userId={userId} />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>
              Check if the calorie tracker widget appears in the top-right
              corner
            </li>
            <li>Run the API tests to verify database connectivity</li>
            <li>Check browser console for any error messages</li>
            <li>Verify that the database schema has been executed</li>
          </ol>
        </div>
      </div>

      {/* Calorie Tracker Widget */}
      <CalorieTracker
        userId={userId}
        position="top-right"
        onLimitExceeded={(data) => {
          alert(
            `Limit exceeded! Current: ${data.currentCalories}, Limit: ${data.dailyLimit}`,
          );
        }}
      />
    </div>
  );
}
