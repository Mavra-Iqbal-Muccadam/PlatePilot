'use client';

import { useState, useEffect } from 'react';

interface AllergiesSelectorProps {
  userId?: number;
  onAllergiesChange?: (allergies: string[]) => void;
}

const ALLERGY_OPTIONS = [
  'Milk',
  'Egg',
  'Peanut',
  'Tree nuts',
  'Wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Corn',
  'Mustard',
  'Banana',
  'Kiwi',
  'Strawberry',
  'Mango',
  'Apple',
  'Celery',
  'Carrot',
  'Tomato',
  'Lentils',
  'Chickpeas',
  'Peas',
  'Cinnamon',
  'Garlic',
  'Coriander',
  'Sunflower seeds',
  'Poppy seeds',
  'Flaxseed',
  'Beef',
  'Chicken',
  'Pork',
  'Cocoa',
  'Sulfites',
  'Food coloring',
  'Preservatives',
];

export default function AllergiesSelector({ userId, onAllergiesChange }: AllergiesSelectorProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user allergies on mount
  useEffect(() => {
    if (userId) {
      loadUserAllergies();
    }
  }, [userId]);

  const loadUserAllergies = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      console.log(`[AllergiesSelector] Loading allergies for userId: ${userId}`);
      
      const response = await fetch(`/api/user-allergies?userId=${userId}`);
      const data = await response.json();

      if (data.success && data.allergies) {
        console.log('[AllergiesSelector] Loaded allergies:', data.allergies);
        setSelectedAllergies(data.allergies);
      }
    } catch (error) {
      console.error('[AllergiesSelector] Error loading allergies:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAllergies = async (allergies: string[]) => {
    if (!userId) {
      console.warn('[AllergiesSelector] userId is not provided, skipping save');
      return;
    }

    try {
      setIsSaving(true);
      console.log(`[AllergiesSelector] Saving allergies for userId: ${userId}`, allergies);
      
      const response = await fetch('/api/user-allergies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, allergies }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('[AllergiesSelector] Successfully saved allergies');
      } else {
        console.error('[AllergiesSelector] Failed to save allergies:', data.error);
      }
    } catch (error) {
      console.error('[AllergiesSelector] Error saving allergies:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAllergy = (allergy: string) => {
    const updated = selectedAllergies.includes(allergy)
      ? selectedAllergies.filter(a => a !== allergy)
      : [...selectedAllergies, allergy];
    
    setSelectedAllergies(updated);
    onAllergiesChange?.(updated);
    saveAllergies(updated);
  };

  const handleAddOther = () => {
    if (otherAllergy.trim() && !selectedAllergies.includes(otherAllergy)) {
      const updated = [...selectedAllergies, otherAllergy];
      setSelectedAllergies(updated);
      onAllergiesChange?.(updated);
      saveAllergies(updated);
      setOtherAllergy('');
      setShowOtherInput(false);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    const updated = selectedAllergies.filter(a => a !== allergy);
    setSelectedAllergies(updated);
    onAllergiesChange?.(updated);
    saveAllergies(updated);
  };

  return (
    <div className="w-full">
      {/* Selected Allergies Display */}
      {selectedAllergies.length > 0 && (
        <div className="mb-4 p-4 rounded-[12px] border border-[#A7C957]/35 bg-[#A7C957]/15">
          <p className="text-sm font-semibold text-[#386641] mb-3">Selected Allergies:</p>
          <div className="flex flex-wrap gap-2">
            {selectedAllergies.map(allergy => (
              <div
                key={allergy}
                className="flex items-center gap-2 bg-[#BC4749] text-white px-3 py-1 rounded-full text-sm"
              >
                <span>{allergy}</span>
                <button
                  onClick={() => handleRemoveAllergy(allergy)}
                  className="hover:opacity-80 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-[#6A994E] hover:bg-[#386641] text-white py-3 px-4 rounded-[12px] font-semibold transition-colors flex items-center justify-between"
        >
          <span>🏥 Select Allergies</span>
          <span className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#6A994E]/35 rounded-[12px] shadow-lg z-50 max-h-96 overflow-y-auto">
            {/* Search/Filter would go here */}
            <div className="p-4 space-y-2">
              {ALLERGY_OPTIONS.map(allergy => (
                <label
                  key={allergy}
                  className="flex items-center gap-3 p-2 hover:bg-[#A7C957]/15 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAllergies.includes(allergy)}
                    onChange={() => handleToggleAllergy(allergy)}
                    className="w-4 h-4 rounded border-[#6A994E] cursor-pointer"
                  />
                  <span className="text-sm text-[#386641]">{allergy}</span>
                </label>
              ))}

              {/* Other Option */}
              <div className="border-t border-[#6A994E]/25 pt-3 mt-3">
                <button
                  onClick={() => setShowOtherInput(!showOtherInput)}
                  className="w-full text-left p-2 hover:bg-[#A7C957]/15 rounded-lg transition-colors text-sm text-[#386641] font-semibold"
                >
                  + Other (specify)
                </button>

                {showOtherInput && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={otherAllergy}
                      onChange={(e) => setOtherAllergy(e.target.value)}
                      placeholder="Enter allergy..."
                      className="flex-1 px-3 py-2 border border-[#6A994E]/35 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6A994E]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddOther();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddOther}
                      className="bg-[#6A994E] hover:bg-[#386641] text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close Dropdown on Outside Click */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
