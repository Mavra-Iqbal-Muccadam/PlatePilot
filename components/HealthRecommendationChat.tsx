'use client';

import { useState, useRef, useEffect } from 'react';
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';

// Observer Pattern for chat state management
interface HealthChatObserver {
  update(state: HealthChatState): void;
}

interface HealthChatState {
  isOpen: boolean;
  currentStep: ChatStep;
  userProfile: UserHealthProfile;
  recommendations: HealthRecommendations | null;
  isLoading: boolean;
  error: string | null;
}

interface UserHealthProfile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: string;
  healthGoal?: string;
  targetCalories?: number;
}

interface HealthRecommendations {
  healthAnalysis: {
    bmi: number;
    bmiCategory: string;
    recommendedCalories: number;
    healthStatus: string;
    recommendations: string[];
  };
  recommendedFoods: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    total_calories: number;
    protein_content: number;
    restaurant: {
      id: number;
      name: string;
      profile_pic?: string;
    };
    suitability_score: number;
  }>;
  aiRecommendations: string;
}

type ChatStep = 'welcome' | 'weight' | 'height' | 'age' | 'gender' | 'activity' | 'goal' | 'target_calories' | 'results';

class HealthChatStateManager {
  private observers: HealthChatObserver[] = [];
  private state: HealthChatState = {
    isOpen: false,
    currentStep: 'welcome',
    userProfile: {},
    recommendations: null,
    isLoading: false,
    error: null
  };

  subscribe(observer: HealthChatObserver): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: HealthChatObserver): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notify(): void {
    this.observers.forEach(observer => observer.update(this.state));
  }

  updateState(newState: Partial<HealthChatState>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState(): HealthChatState {
    return { ...this.state };
  }

  resetChat(): void {
    this.state = {
      isOpen: false,
      currentStep: 'welcome',
      userProfile: {},
      recommendations: null,
      isLoading: false,
      error: null
    };
    this.notify();
  }
}

// Strategy Pattern for step navigation
interface StepNavigationStrategy {
  getNextStep(currentStep: ChatStep, userProfile: UserHealthProfile): ChatStep;
  isStepComplete(step: ChatStep, userProfile: UserHealthProfile): boolean;
}

class LinearStepNavigationStrategy implements StepNavigationStrategy {
  private stepOrder: ChatStep[] = ['welcome', 'weight', 'height', 'age', 'gender', 'activity', 'goal', 'target_calories', 'results'];

  getNextStep(currentStep: ChatStep, userProfile: UserHealthProfile): ChatStep {
    const currentIndex = this.stepOrder.indexOf(currentStep);
    if (currentIndex < this.stepOrder.length - 1) {
      return this.stepOrder[currentIndex + 1];
    }
    return 'results';
  }

  isStepComplete(step: ChatStep, userProfile: UserHealthProfile): boolean {
    switch (step) {
      case 'welcome':
        return true;
      case 'weight':
        return !!userProfile.weight;
      case 'height':
        return !!userProfile.height;
      case 'age':
        return !!userProfile.age;
      case 'gender':
        return !!userProfile.gender;
      case 'activity':
        return !!userProfile.activityLevel;
      case 'goal':
        return !!userProfile.healthGoal;
      case 'target_calories':
        return true; // Optional step
      default:
        return false;
    }
  }
}

interface HealthRecommendationChatProps {
  onFoodSelect?: (food: any) => void;
}

export default function HealthRecommendationChat({ onFoodSelect }: HealthRecommendationChatProps) {
  const [chatState, setChatState] = useState<HealthChatState>({
    isOpen: false,
    currentStep: 'welcome',
    userProfile: {},
    recommendations: null,
    isLoading: false,
    error: null
  });
  
  const [inputValue, setInputValue] = useState('');
  const stateManagerRef = useRef<HealthChatStateManager>(new HealthChatStateManager());
  const navigationStrategyRef = useRef<StepNavigationStrategy>(new LinearStepNavigationStrategy());

  useEffect(() => {
    const stateManager = stateManagerRef.current;
    
    const observer: HealthChatObserver = {
      update: (state: HealthChatState) => {
        setChatState(state);
      }
    };

    stateManager.subscribe(observer);

    return () => {
      stateManager.unsubscribe(observer);
    };
  }, []);

  const handleToggleChat = () => {
    const stateManager = stateManagerRef.current;
    const currentState = stateManager.getState();
    
    if (currentState.isOpen) {
      stateManager.resetChat();
    } else {
      stateManager.updateState({ isOpen: true });
    }
  };

  const handleStepInput = async (value: string) => {
    const stateManager = stateManagerRef.current;
    const currentState = stateManager.getState();
    const navigationStrategy = navigationStrategyRef.current;

    let updatedProfile = { ...currentState.userProfile };

    // Update profile based on current step
    switch (currentState.currentStep) {
      case 'weight':
        updatedProfile.weight = parseFloat(value);
        break;
      case 'height':
        updatedProfile.height = parseFloat(value);
        break;
      case 'age':
        updatedProfile.age = parseInt(value);
        break;
      case 'gender':
        updatedProfile.gender = value as 'male' | 'female';
        break;
      case 'activity':
        updatedProfile.activityLevel = value;
        break;
      case 'goal':
        updatedProfile.healthGoal = value;
        break;
      case 'target_calories':
        if (value.trim()) {
          updatedProfile.targetCalories = parseFloat(value);
        }
        break;
    }

    stateManager.updateState({ userProfile: updatedProfile });

    // Move to next step
    const nextStep = navigationStrategy.getNextStep(currentState.currentStep, updatedProfile);
    
    if (nextStep === 'results') {
      await fetchHealthRecommendations(updatedProfile);
    } else {
      stateManager.updateState({ currentStep: nextStep });
    }

    setInputValue('');
  };

  const fetchHealthRecommendations = async (profile: UserHealthProfile) => {
    const stateManager = stateManagerRef.current;
    
    try {
      stateManager.updateState({ isLoading: true, error: null });

      const response = await fetch('/api/health-food-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      const result = await response.json();

      if (result.success) {
        stateManager.updateState({
          recommendations: result,
          currentStep: 'results',
          isLoading: false
        });
      } else {
        stateManager.updateState({
          error: result.error || 'Failed to get recommendations',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching health recommendations:', error);
      stateManager.updateState({
        error: 'Network error occurred',
        isLoading: false
      });
    }
  };

  const handleFoodSelect = (food: any) => {
    if (onFoodSelect) {
      onFoodSelect(food);
    }
    handleToggleChat(); // Close chat after selection
  };

  const renderStepContent = () => {
    const { currentStep, userProfile, recommendations, isLoading, error } = chatState;

    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your health profile and finding the best foods for you...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">😞</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => stateManagerRef.current.updateState({ error: null, currentStep: 'welcome' })}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="text-5xl mb-4">😋</div>
            <h3 className="text-xl font-bold mb-3 text-[#386641]">Personalized Food Recommendations</h3>
            <p className="text-gray-700 mb-6 text-sm">
              I'll analyze your health profile and recommend meals perfectly suited to your goals!
            </p>
            <button
              onClick={() => stateManagerRef.current.updateState({ currentStep: 'weight' })}
              className="bg-[#6A994E] hover:bg-[#386641] text-white px-6 py-3 rounded-[12px] font-semibold transition-colors"
            >
              Get Started 🚀
            </button>
          </div>
        );

      case 'weight':
        return (
          <div>
            <h4 className="font-semibold mb-4 text-[#386641]">What's your current weight?</h4>
            <p className="text-sm text-gray-600 mb-4">Please enter in kilograms (kg)</p>
            <input
              type="number"
              placeholder="e.g., 70"
              className="w-full p-3 border border-[#A7C957] rounded-[12px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#6A994E]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inputValue && handleStepInput(inputValue)}
            />
            <button
              onClick={() => inputValue && handleStepInput(inputValue)}
              disabled={!inputValue}
              className="w-full bg-[#6A994E] hover:bg-[#386641] text-white py-3 rounded-[12px] disabled:bg-gray-300 font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        );

      case 'height':
        return (
          <div>
            <h4 className="font-semibold mb-4 text-[#386641]">What's your height?</h4>
            <p className="text-sm text-gray-600 mb-4">Please enter in centimeters (cm)</p>
            <input
              type="number"
              placeholder="e.g., 175"
              className="w-full p-3 border border-[#A7C957] rounded-[12px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#6A994E]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inputValue && handleStepInput(inputValue)}
            />
            <button
              onClick={() => inputValue && handleStepInput(inputValue)}
              disabled={!inputValue}
              className="w-full bg-[#6A994E] hover:bg-[#386641] text-white py-3 rounded-[12px] disabled:bg-gray-300 font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        );

      case 'age':
        return (
          <div>
            <h4 className="font-semibold mb-4 text-[#386641]">What's your age?</h4>
            <input
              type="number"
              placeholder="e.g., 25"
              className="w-full p-3 border border-[#A7C957] rounded-[12px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#6A994E]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && inputValue && handleStepInput(inputValue)}
            />
            <button
              onClick={() => inputValue && handleStepInput(inputValue)}
              disabled={!inputValue}
              className="w-full bg-[#6A994E] hover:bg-[#386641] text-white py-3 rounded-[12px] disabled:bg-gray-300 font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        );

      case 'gender':
        return (
          <div>
            <h4 className="font-semibold mb-4 text-[#386641]">What's your gender?</h4>
            <div className="space-y-3">
              <button
                onClick={() => handleStepInput('male')}
                className="w-full bg-[#A7C957]/30 hover:bg-[#A7C957]/50 text-[#386641] py-3 rounded-[12px] font-medium transition-colors"
              >
                👨 Male
              </button>
              <button
                onClick={() => handleStepInput('female')}
                className="w-full bg-[#A7C957]/30 hover:bg-[#A7C957]/50 text-[#386641] py-3 rounded-[12px] font-medium transition-colors"
              >
                👩 Female
              </button>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div>
            <h4 className="font-semibold mb-4">What's your activity level?</h4>
            <div className="space-y-2">
              {[
                { value: 'sedentary', label: '🛋️ Sedentary (little/no exercise)' },
                { value: 'light', label: '🚶 Light (light exercise 1-3 days/week)' },
                { value: 'moderate', label: '🏃 Moderate (moderate exercise 3-5 days/week)' },
                { value: 'active', label: '💪 Active (hard exercise 6-7 days/week)' },
                { value: 'very_active', label: '🏋️ Very Active (very hard exercise, physical job)' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStepInput(option.value)}
                  className="w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg text-sm"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'goal':
        return (
          <div>
            <h4 className="font-semibold mb-4">What's your health goal?</h4>
            <div className="space-y-2">
              {[
                { value: 'weight_loss', label: '📉 Lose Weight' },
                { value: 'weight_gain', label: '📈 Gain Weight' },
                { value: 'maintenance', label: '⚖️ Maintain Current Weight' },
                { value: 'muscle_gain', label: '💪 Build Muscle' },
                { value: 'general_health', label: '🌟 General Health & Wellness' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStepInput(option.value)}
                  className="w-full text-left bg-gray-100 hover:bg-gray-200 p-3 rounded-lg"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'target_calories':
        return (
          <div>
            <h4 className="font-semibold mb-4">Target daily calories (optional)</h4>
            <p className="text-sm text-gray-600 mb-4">
              Leave blank to use our calculated recommendation
            </p>
            <input
              type="number"
              placeholder="e.g., 2000"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStepInput(inputValue || '0')}
            />
            <div className="space-y-2">
              <button
                onClick={() => handleStepInput(inputValue || '0')}
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
              >
                Get My Recommendations
              </button>
              <button
                onClick={() => handleStepInput('0')}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Skip (Use Calculated)
              </button>
            </div>
          </div>
        );

      case 'results':
        if (!recommendations) return null;

        return (
          <div className="space-y-6">
            {/* Health Analysis */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3">Your Health Analysis</h4>
              <div className="space-y-2 text-sm">
                <p><strong>BMI:</strong> {recommendations.healthAnalysis.bmi} ({recommendations.healthAnalysis.bmiCategory})</p>
                <p><strong>Recommended Calories:</strong> {recommendations.healthAnalysis.recommendedCalories}/day</p>
                <p className="text-green-700">{recommendations.healthAnalysis.healthStatus}</p>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Personalized Advice</h4>
              <p className="text-sm text-blue-700">{recommendations.aiRecommendations}</p>
            </div>

            {/* Recommended Foods */}
            <div>
              <h4 className="font-semibold mb-3">Recommended Foods for You</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {recommendations.recommendedFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleFoodSelect(food)}
                    className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      {food.image_url ? (
                        <img 
                          src={food.image_url} 
                          alt={food.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🍽️</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800">{food.name}</h5>
                        <p className="text-xs text-gray-600">{food.restaurant.name}</p>
                        <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-semibold text-green-600">PKR {food.price}</span>
                          <span className="text-xs text-gray-500">{food.total_calories} cal</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {food.suitability_score}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => stateManagerRef.current.resetChat()}
              className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Start Over
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {/* Health Chat Toggle Button */}
      <button
        onClick={handleToggleChat}
        className="fixed bottom-48 left-6 flex h-20 w-20 flex-col items-center justify-center rounded-3xl border border-white/45 bg-gradient-to-br from-[#6A994E] via-[#5B8A45] to-[#386641] text-white shadow-2xl shadow-green-900/20 backdrop-blur-md transition-all transform hover:-translate-y-1 hover:scale-105 hover:from-[#5B8A45] hover:to-[#2d4f31]"
        style={{ zIndex: 1000 }}
        title="Health Recommendation Chatbot - Click for personalized meal suggestions"
        aria-label="Health Recommendation Chatbot"
      >
        <HiOutlineChatBubbleLeftRight className="h-7 w-7" />
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/90">
          Health Chat
        </span>
      </button>

      {/* Modal Overlay */}
      {chatState.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleToggleChat();
            }
          }}
        >
          {/* Modal Content */}
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6A994E] to-[#386641] text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl">🏥 Health Assistant</h3>
                <p className="text-sm text-[#A7C957]">Get personalized food recommendations</p>
              </div>
              <button
                onClick={handleToggleChat}
                className="text-white hover:text-[#A7C957] transition-colors text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderStepContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}