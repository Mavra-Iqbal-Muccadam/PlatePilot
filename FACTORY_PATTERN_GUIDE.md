# Factory Pattern Usage in PlatePilot Application

## Overview
The Factory Pattern is used in this application to create and manage singleton instances of repository classes. This ensures that only one instance of each repository exists throughout the application lifecycle, promoting consistency and reducing memory overhead.

---

## 1. **Calorie Calculator Service** (`lib/services/calorie-calculator.ts`)

### Location & Purpose
- **File**: `lib/services/calorie-calculator.ts`
- **Factory Class**: `CalorieRepositoryFactory`
- **Purpose**: Creates and manages a singleton instance of `CalorieRepository`

### How It Works

```typescript
class CalorieRepositoryFactory {
  private static instance: CalorieRepository;

  static getInstance(): CalorieRepository {
    if (!this.instance) {
      this.instance = new SupabaseCalorieRepository();
    }
    return this.instance;
  }
}
```

### Why It's Used
1. **Singleton Pattern**: Ensures only one `SupabaseCalorieRepository` instance exists
2. **Lazy Initialization**: Repository is created only when first requested
3. **Consistent Data Access**: All calorie calculations use the same repository instance
4. **Memory Efficiency**: Avoids creating multiple repository instances

### Usage Example
```typescript
export class CalorieCalculatorService {
  private repository: CalorieRepository;

  constructor(repository?: CalorieRepository) {
    // Uses factory to get singleton instance if no repository provided
    this.repository = repository || CalorieRepositoryFactory.getInstance();
  }

  async calculateFoodCalories(foodId: number): Promise<number> {
    return this.repository.getFoodCalories(foodId);
  }
}
```

### Features Enabled
- Calculate calories from food items (direct or detailed)
- Calculate total calories for deals (sum of all food items)
- Calculate calories for multiple items with quantities

---

## 2. **User Profile Service** (`lib/services/user-profile-service.ts`)

### Location & Purpose
- **File**: `lib/services/user-profile-service.ts`
- **Factory Class**: `UserProfileRepositoryFactory`
- **Purpose**: Creates and manages a singleton instance of `UserProfileRepository`

### How It Works

```typescript
class UserProfileRepositoryFactory {
  private static instance: UserProfileRepository;

  static getInstance(): UserProfileRepository {
    if (!this.instance) {
      this.instance = new SupabaseUserProfileRepository();
    }
    return this.instance;
  }
}
```

### Why It's Used
1. **Singleton Pattern**: Ensures only one `SupabaseUserProfileRepository` instance exists
2. **Consistent Profile Access**: All profile operations use the same repository
3. **Cache Management**: Single instance maintains profile cache across the app
4. **Observer Notification**: Single instance manages all profile change observers

### Usage Example
```typescript
export class UserProfileService {
  private repository: UserProfileRepository;
  private profileCache: Map<number, UserProfile> = new Map();

  constructor(repository?: UserProfileRepository) {
    // Uses factory to get singleton instance
    this.repository = repository || UserProfileRepositoryFactory.getInstance();
  }

  async getUserProfile(userId: number): Promise<UserProfile | null> {
    // Check cache first
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }
    // Fetch from repository
    const profile = await this.repository.getUserProfile(userId);
    if (profile) {
      this.profileCache.set(userId, profile);
    }
    return profile;
  }
}
```

### Features Enabled
- Fetch user profile (username, email, age, weight, profession)
- Update user profile with new values
- Cache profiles for performance
- Notify observers when profile changes

---

## 3. **Allergies Service** (`lib/services/allergies-service.ts`)

### Location & Purpose
- **File**: `lib/services/allergies-service.ts`
- **Factory Class**: `AllergiesRepositoryFactory`
- **Purpose**: Creates and manages a singleton instance of `AllergiesRepository`

### How It Works

```typescript
class AllergiesRepositoryFactory {
  private static instance: AllergiesRepository;

  static getInstance(): AllergiesRepository {
    if (!this.instance) {
      this.instance = new SupabaseAllergiesRepository();
    }
    return this.instance;
  }
}
```

### Why It's Used
1. **Singleton Pattern**: Ensures only one `SupabaseAllergiesRepository` instance exists
2. **Consistent Allergy Data**: All allergy operations use the same repository
3. **Cache Management**: Single instance maintains allergy cache
4. **Observer Notification**: Single instance manages all allergy change observers

### Usage Example
```typescript
export class AllergiesService {
  private repository: AllergiesRepository;
  private allergiesCache: Map<number, string[]> = new Map();

  constructor(repository?: AllergiesRepository) {
    // Uses factory to get singleton instance
    this.repository = repository || AllergiesRepositoryFactory.getInstance();
  }

  async getUserAllergies(userId: number): Promise<string[]> {
    // Check cache first
    if (this.allergiesCache.has(userId)) {
      return this.allergiesCache.get(userId)!;
    }
    // Fetch from repository
    const allergies = await this.repository.getUserAllergies(userId);
    this.allergiesCache.set(userId, allergies);
    return allergies;
  }

  async addAllergy(userId: number, allergy: string): Promise<boolean> {
    const currentAllergies = await this.getUserAllergies(userId);
    if (!currentAllergies.includes(allergy)) {
      const updatedAllergies = [...currentAllergies, allergy];
      return this.updateUserAllergies(userId, updatedAllergies);
    }
    return true;
  }
}
```

### Features Enabled
- Fetch user allergies
- Add/remove individual allergies
- Update all allergies at once
- Clear all allergies
- Cache allergies for performance
- Notify observers when allergies change

---

## 4. **Halal Verifier Service** (`lib/services/halal-verifier.ts`)

### Location & Purpose
- **File**: `lib/services/halal-verifier.ts`
- **Factory Class**: `HalalRepositoryFactory`
- **Purpose**: Creates and manages a singleton instance of `HalalRepository`

### How It Works

```typescript
class HalalRepositoryFactory {
  private static instance: HalalRepository;

  static getInstance(): HalalRepository {
    if (!this.instance) {
      this.instance = new SupabaseHalalRepository();
    }
    return this.instance;
  }
}
```

### Why It's Used
1. **Singleton Pattern**: Ensures only one `SupabaseHalalRepository` instance exists
2. **Consistent Halal Verification**: All halal checks use the same repository
3. **Cache Management**: Single instance maintains halal verification cache (24-hour validity)
4. **Observer Notification**: Single instance manages all halal status change observers

### Usage Example
```typescript
export class HalalVerifierService {
  private repository: HalalRepository;
  private observers: Map<number, HalalStatusObserver[]> = new Map();
  private verificationCache: Map<number, HalalVerificationResult> = new Map();

  constructor(repository?: HalalRepository) {
    // Uses factory to get singleton instance
    this.repository = repository || HalalRepositoryFactory.getInstance();
  }

  async verifyDeal(dealId: number): Promise<HalalVerificationResult> {
    // Check cache first
    const cached = await this.repository.getCachedResult(dealId);
    if (cached) {
      return cached;
    }

    // Get ingredients and verify
    const ingredients = await this.repository.getDealIngredients(dealId);
    const isHalal = await this.provider.verify(ingredients);
    
    // Cache result
    const result: HalalVerificationResult = {
      dealId,
      isHalal,
      verifiedAt: new Date(),
      ingredients
    };
    await this.repository.cacheHalalResult(dealId, result);
    
    // Notify observers
    this.notifyObservers(dealId, isHalal);
    
    return result;
  }
}
```

### Features Enabled
- Verify if deals are halal
- Verify if individual food items are halal
- Cache verification results (24-hour validity)
- Fetch ingredients from deals and food items
- Notify observers when halal status changes

---

## Design Pattern Benefits Summary

| Benefit | Description |
|---------|-------------|
| **Singleton** | Only one repository instance exists, reducing memory usage |
| **Lazy Initialization** | Repository created only when first needed |
| **Consistency** | All operations use the same data access layer |
| **Testability** | Easy to inject mock repositories for testing |
| **Maintainability** | Centralized repository creation logic |
| **Scalability** | Easy to add new repository types without changing service code |

---

## How to Use the Factories

### In Components
```typescript
import { CalorieCalculatorService } from '@/lib/services/calorie-calculator';
import { AllergiesService } from '@/lib/services/allergies-service';
import { UserProfileService } from '@/lib/services/user-profile-service';
import { HalalVerifierService } from '@/lib/services/halal-verifier';

// Services automatically use factory to get singleton repositories
const calorieService = new CalorieCalculatorService();
const allergiesService = new AllergiesService();
const profileService = new UserProfileService();
const halalService = new HalalVerifierService();

// Use the services
const calories = await calorieService.calculateFoodCalories(foodId);
const allergies = await allergiesService.getUserAllergies(userId);
const profile = await profileService.getUserProfile(userId);
const halalResult = await halalService.verifyDeal(dealId);
```

### For Testing (Dependency Injection)
```typescript
// Create mock repository
const mockRepository = {
  getUserAllergies: async () => ['Peanut', 'Milk'],
  updateUserAllergies: async () => true
};

// Inject mock into service
const allergiesService = new AllergiesService(mockRepository);
```

---

## Key Takeaways

1. **Factory Pattern** is used to create singleton repository instances
2. **Four main factories** exist: `CalorieRepositoryFactory`, `UserProfileRepositoryFactory`, `AllergiesRepositoryFactory`, `HalalRepositoryFactory`
3. **Each factory** ensures only one instance of its repository exists
4. **Services use factories** to get repositories via `getInstance()`
5. **Dependency injection** is supported for testing purposes
6. **Caching** is implemented at the service level for performance
7. **Observer pattern** is combined with factories for reactive updates
