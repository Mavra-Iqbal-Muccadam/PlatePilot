'use client';

import { useState, useEffect } from 'react';

const PROFESSION_OPTIONS = [
  'Teacher',
  'Doctor',
  'Engineer',
  'Nurse',
  'Lawyer',
  'Accountant',
  'Software Developer',
  'Designer',
  'Manager',
  'Chef',
  'Farmer',
  'Mechanic',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Artist',
  'Musician',
  'Writer',
  'Photographer',
  'Consultant',
  'Other',
];

interface UserProfileEditorProps {
  userId: number;
  initialAge?: number;
  initialWeight?: number;
  initialProfession?: string;
  onProfileUpdate?: (profile: { age?: number; weight?: number; profession?: string }) => void;
}

export default function UserProfileEditor({
  userId,
  initialAge,
  initialWeight,
  initialProfession,
  onProfileUpdate,
}: UserProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState<string>(initialAge?.toString() || '');
  const [weight, setWeight] = useState<string>(initialWeight?.toString() || '');
  const [profession, setProfession] = useState(initialProfession || '');
  const [selectedProfession, setSelectedProfession] = useState<string>(
    PROFESSION_OPTIONS.includes(initialProfession || '') ? initialProfession || '' : 'Other'
  );
  const [showOtherInput, setShowOtherInput] = useState<boolean>(
    Boolean(!PROFESSION_OPTIONS.includes(initialProfession || '') && initialProfession)
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setAge(initialAge?.toString() || '');
    setWeight(initialWeight?.toString() || '');
    setProfession(initialProfession || '');
    setSelectedProfession(
      PROFESSION_OPTIONS.includes(initialProfession || '') ? initialProfession || '' : 'Other'
    );
    setShowOtherInput(Boolean(!PROFESSION_OPTIONS.includes(initialProfession || '') && initialProfession));
  }, [initialAge, initialWeight, initialProfession]);

  const handleProfessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProfession(value);
    
    if (value === 'Other') {
      setShowOtherInput(true);
      setProfession('');
    } else {
      setShowOtherInput(false);
      setProfession(value);
    }
  };

  const handleOtherProfessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfession(e.target.value);
  };

  const handleSave = async () => {
    if (!age && !weight && !profession) {
      setMessage({ type: 'error', text: 'Please fill in at least one field' });
      return;
    }

    setSaving(true);
    try {
      console.log('[UserProfileEditor] Saving profile updates:', { age, weight, profession });

      const response = await fetch('/api/user-profile-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          age: age ? parseInt(age) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          profession: profession || undefined,
        }),
      });

      const data = await response.json();
      console.log('[UserProfileEditor] Response:', data);

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        onProfileUpdate?.({
          age: age ? parseInt(age) : undefined,
          weight: weight ? parseFloat(weight) : undefined,
          profession: profession || undefined,
        });
        setIsEditing(false);

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('[UserProfileEditor] Error:', error);
      setMessage({ type: 'error', text: 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAge(initialAge?.toString() || '');
    setWeight(initialWeight?.toString() || '');
    setProfession(initialProfession || '');
    setSelectedProfession(
      PROFESSION_OPTIONS.includes(initialProfession || '') ? initialProfession || '' : 'Other'
    );
    setShowOtherInput(Boolean(!PROFESSION_OPTIONS.includes(initialProfession || '') && initialProfession));
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="mt-4 rounded-[14px] border border-[#6A994E]/35 bg-[#A7C957]/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#386641]">Personal Information</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm bg-[#6A994E] hover:bg-[#386641] text-white px-3 py-1 rounded-[8px] transition-colors"
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        // View Mode
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-[#6A994E]/25">
            <span className="text-[#6A994E]">Age:</span>
            <span className="font-semibold text-[#386641]">{age || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-[#6A994E]/25">
            <span className="text-[#6A994E]">Weight:</span>
            <span className="font-semibold text-[#386641]">{weight ? `${weight} kg` : 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6A994E]">Profession:</span>
            <span className="font-semibold text-[#386641]">{profession || 'Not set'}</span>
          </div>
        </div>
      ) : (
        // Edit Mode
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#386641] mb-2">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              min="1"
              max="150"
              className="w-full px-3 py-2 border border-[#6A994E]/35 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6A994E] text-[#386641]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#386641] mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight"
              min="1"
              max="500"
              step="0.1"
              className="w-full px-3 py-2 border border-[#6A994E]/35 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6A994E] text-[#386641]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#386641] mb-2">Profession</label>
            <select
              value={selectedProfession}
              onChange={handleProfessionChange}
              className="w-full px-3 py-2 border border-[#6A994E]/35 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6A994E] text-[#386641] bg-white"
            >
              <option value="">Select a profession</option>
              {PROFESSION_OPTIONS.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>

            {showOtherInput && (
              <input
                type="text"
                value={profession}
                onChange={handleOtherProfessionChange}
                placeholder="Enter your profession"
                className="w-full px-3 py-2 border border-[#6A994E]/35 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#6A994E] text-[#386641] mt-2"
              />
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-[10px] text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-[#1F8A4D]/15 text-[#1F8A4D] border border-[#1F8A4D]/35'
                  : 'bg-[#BC4749]/15 text-[#BC4749] border border-[#BC4749]/35'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#6A994E] hover:bg-[#386641] disabled:bg-[#6A994E]/50 text-white py-2 px-4 rounded-[10px] font-semibold transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 py-2 px-4 rounded-[10px] font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
