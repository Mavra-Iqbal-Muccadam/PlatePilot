'use client';

import { useState } from 'react';
import { useCalorieTracker } from './CalorieTracker';

interface ManualCalorieEntryProps {
  userId: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ManualCalorieEntry({ userId, onSuccess, onError }: ManualCalorieEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { addManualCalories } = useCalorieTracker(userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foodName.trim() || !calories || isNaN(parseInt(calories))) {
      onError?.('Please enter both food name and calories');
      return;
    }

    try {
      setLoading(true);
      const result = await addManualCalories(parseInt(calories), foodName.trim());
      
      if (result.success) {
        setFoodName('');
        setCalories('');
        setIsOpen(false);
        onSuccess?.();
      } else {
        onError?.(result.error || 'Failed to add calories');
      }
    } catch (error) {
      console.error('Error adding manual calories:', error);
      onError?.('An error occurred while adding calories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <span className="text-lg">➕</span>
        Add Manual Calories
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-w-sm mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add Manual Calories</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food/Meal Name
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g., Homemade Salad, Snack, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 150"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="1"
                  max="5000"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Enter the estimated calories for this food item
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !foodName.trim() || !calories}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Adding...' : 'Add Calories'}
                </button>
              </div>
            </form>

            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700">
                <div className="font-semibold mb-1">💡 Quick Reference:</div>
                <div className="text-xs space-y-1">
                  <div>• Apple: ~80 cal</div>
                  <div>• Banana: ~100 cal</div>
                  <div>• Slice of bread: ~80 cal</div>
                  <div>• Cup of coffee: ~5 cal</div>
                  <div>• Glass of milk: ~150 cal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}