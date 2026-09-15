# Design Patterns Quick Reference Guide

## Pattern Usage Matrix

| Pattern          | Feature             | File Path                                  | Why Used                                                                   |
| ---------------- | ------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| **Factory**      | Calorie Tracking    | `lib/services/calorie-calculator.ts`       | Singleton repository instance                                              |
| **Factory**      | User Profile        | `lib/services/user-profile-service.ts`     | Singleton repository instance                                              |
| **Factory**      | Allergies           | `lib/services/allergies-service.ts`        | Singleton repository instance                                              |
| **Factory**      | Halal Verification  | `lib/services/halal-verifier.ts`           | Singleton repository instance                                              |
| **Factory**      | Cart Management     | `lib/services/cart-service.ts`             | Singleton service instance                                                 |
| **Factory**      | Order Management    | `lib/services/order-service.ts`            | Singleton service instance                                                 |
| **Factory**      | Grocery Management  | `lib/services/grocery-service.ts`          | Singleton service instance                                                 |
| **Factory**      | Budget Planning     | `lib/services/budget-planning-service.ts`  | Singleton service instance                                                 |
| **Factory**      | Food Display        | `lib/services/food-service.ts`             | Singleton service instance                                                 |
| **Strategy**     | Calorie Calculation | `lib/services/calorie-calculator.ts`       | DirectFoodCalorieStrategy vs DetailedFoodCalorieStrategy                   |
| **Strategy**     | Food Display        | `lib/services/food-service.ts`             | GridDisplayStrategy vs ListDisplayStrategy vs SearchResultsDisplayStrategy |
| **Strategy**     | Budget Pricing      | `lib/services/budget-planning-service.ts`  | LLMPriceFetchingStrategy                                                   |
| **Strategy**     | Grocery Extraction  | `lib/services/grocery-service.ts`          | FoodDetailsExtractionStrategy vs AIIngredientExtractionStrategy            |
| **Strategy**     | Calorie Tracking    | `lib/services/calorie-tracker-service.ts`  | FoodCalorieStrategy vs DealCalorieStrategy                                 |
| **Strategy**     | Order Validation    | `lib/services/order-service.ts`            | UnifiedOrderStrategy                                                       |
| **Repository**   | All Services        | `lib/services/*.ts`                        | Abstract data access layer                                                 |
| **Repository**   | Menu Items          | `lib/repositories/menu-item-repository.ts` | Food CRUD operations                                                       |
| **Repository**   | Food Search         | `lib/repositories/food-repository.ts`      | Food retrieval                                                             |
| **Observer**     | User Profile        | `lib/services/user-profile-service.ts`     | Notify profile changes                                                     |
| **Observer**     | Allergies           | `lib/services/allergies-service.ts`        | Notify allergy changes                                                     |
| **Observer**     | Halal Status        | `lib/services/halal-verifier.ts`           | Notify halal status changes                                                |
| **Observer**     | Order Status        | `lib/services/order-service.ts`            | Notify order status changes                                                |
| **Observer**     | Calorie Limit       | `lib/services/calorie-tracker-service.ts`  | Notify limit exceeded                                                      |
| **Command**      | Cart Operations     | `lib/services/cart-service.ts`             | AddToCartCommand, RemoveFromCartCommand                                    |
| **Command**      | Order Creation      | `lib/services/order-service.ts`            | CreateOrderCommand, UpdateOrderStatusCommand                               |
| **Command**      | Budget Generation   | `lib/services/budget-planning-service.ts`  | FetchPricesCommand, GenerateBudgetPDFCommand                               |
| **Command**      | Grocery Management  | `lib/services/grocery-service.ts`          | AddIngredientsCommand, RemoveItemCommand                                   |
| **Command**      | Image Upload        | `lib/commands/upload-command.ts`           | Image upload operations                                                    |
| **Command**      | PDF Generation      | `lib/commands/pdf-generator-command.ts`    | PDF generation                                                             |
| **Composite**    | Cart Items          | `lib/services/cart-service.ts`             | FoodCartItem vs DealCartItem                                               |
| **Decorator**    | Halal Badge         | `components/HalalBadge.tsx`                | Add halal badge to items                                                   |
| **Unit of Work** | Menu Items          | `lib/services/menu-item-service.ts`        | Coordinate food + food_details                                             |
| **Singleton**    | All Factories       | `lib/services/*.ts`                        | Ensure single instance                                                     |

---

## Feature-to-Pattern Mapping

### 1. Calorie Tracking

```
Strategy Pattern (2 strategies)
    ↓
Factory Pattern (CalorieRepositoryFactory)
    ↓
Repository Pattern (SupabaseCalorieRepository)
    ↓
Observer Pattern (notify limit exceeded)
```

**Files**: `lib/services/calorie-calculator.ts`, `components/SimpleCalorieCounter.tsx`

### 2. User Profile

```
Factory Pattern (UserProfileRepositoryFactory)
    ↓
Repository Pattern (SupabaseUserProfileRepository)
    ↓
Observer Pattern (notify profile changes)
    ↓
Caching (in-memory cache)
```

**Files**: `lib/services/user-profile-service.ts`, `components/UserProfileEditor.tsx`

### 3. Allergies Management

```
Factory Pattern (AllergiesRepositoryFactory)
    ↓
Repository Pattern (SupabaseAllergiesRepository)
    ↓
Observer Pattern (notify allergy changes)
    ↓
Caching (in-memory cache)
```

**Files**: `lib/services/allergies-service.ts`, `components/AllergiesSelector.tsx`

### 4. Halal Verification

```
Factory Pattern (HalalRepositoryFactory)
    ↓
Repository Pattern (SupabaseHalalRepository)
    ↓
Observer Pattern (notify halal status)
    ↓
Decorator Pattern (HalalBadge)
    ↓
Caching (24-hour cache)
```

**Files**: `lib/services/halal-verifier.ts`, `components/HalalBadge.tsx`

### 5. Cart Management

```
Composite Pattern (FoodCartItem + DealCartItem)
    ↓
Command Pattern (cart operations)
    ↓
Factory Pattern (CartServiceFactory)
    ↓
Repository Pattern (SupabaseCartRepository)
```

**Files**: `lib/services/cart-service.ts`, `components/OrderCart.tsx`

### 6. Order Management

```
Command Pattern (CreateOrderCommand)
    ↓
Strategy Pattern (UnifiedOrderStrategy)
    ↓
Repository Pattern (SupabaseOrderRepository)
    ↓
Observer Pattern (notify status changes)
```

**Files**: `lib/services/order-service.ts`, `app/api/orders/create/route.ts`

### 7. Grocery & Budget

```
Strategy Pattern (ingredient extraction)
    ↓
Command Pattern (budget operations)
    ↓
Factory Pattern (GroceryServiceFactory)
    ↓
Repository Pattern (SupabaseGroceryRepository)
```

**Files**: `lib/services/grocery-service.ts`, `lib/services/budget-planning-service.ts`

### 8. Food & Menu

```
Unit of Work Pattern (MenuItemService)
    ↓
Strategy Pattern (display strategies)
    ↓
Factory Pattern (FoodServiceFactory)
    ↓
Repository Pattern (MenuItemRepository)
```

**Files**: `lib/services/menu-item-service.ts`, `lib/services/food-service.ts`

---

## Pattern Implementation Examples

### Factory Pattern Example

```typescript
// In CalorieCalculatorService
class CalorieRepositoryFactory {
  private static instance: CalorieRepository;

  static getInstance(): CalorieRepository {
    if (!this.instance) {
      this.instance = new SupabaseCalorieRepository();
    }
    return this.instance;
  }
}

// Usage
export class CalorieCalculatorService {
  private repository: CalorieRepository;

  constructor(repository?: CalorieRepository) {
    this.repository = repository || CalorieRepositoryFactory.getInstance();
  }
}
```

### Strategy Pattern Example

```typescript
// In CalorieCalculatorService
interface CalorieCalculationStrategy {
  calculate(foodId: number): Promise<number>;
}

class DirectFoodCalorieStrategy implements CalorieCalculationStrategy {
  async calculate(foodId: number): Promise<number> {
    // Get from food.total_calories
  }
}

class DetailedFoodCalorieStrategy implements CalorieCalculationStrategy {
  async calculate(foodId: number): Promise<number> {
    // Sum from food_details
  }
}
```

### Observer Pattern Example

```typescript
// In UserProfileService
interface UserProfileObserver {
  onProfileChanged(userId: number, profile: UserProfile): void;
}

export class UserProfileService {
  private observers: Map<number, UserProfileObserver[]> = new Map();

  subscribe(userId: number, observer: UserProfileObserver): void {
    if (!this.observers.has(userId)) {
      this.observers.set(userId, []);
    }
    this.observers.get(userId)!.push(observer);
  }

  private notifyObservers(userId: number, profile: UserProfile): void {
    const userObservers = this.observers.get(userId);
    if (userObservers) {
      userObservers.forEach((observer) => {
        observer.onProfileChanged(userId, profile);
      });
    }
  }
}
```

### Repository Pattern Example

```typescript
// In AllergiesService
interface AllergiesRepository {
  getUserAllergies(userId: number): Promise<string[]>;
  updateUserAllergies(userId: number, allergies: string[]): Promise<boolean>;
}

class SupabaseAllergiesRepository implements AllergiesRepository {
  async getUserAllergies(userId: number): Promise<string[]> {
    const { data } = await supabase
      .from("users")
      .select("allergies")
      .eq("id", userId)
      .single();
    return data?.allergies || [];
  }
}
```

### Command Pattern Example

```typescript
// In OrderService
export interface OrderCommand {
  execute(): Promise<{ success: boolean; orderId?: number; error?: string }>;
}

export class CreateOrderCommand implements OrderCommand {
  constructor(private orderData: OrderData) {}

  async execute(): Promise<{
    success: boolean;
    orderId?: number;
    error?: string;
  }> {
    // Validate, create, return result
  }
}
```

### Composite Pattern Example

```typescript
// In CartService
export abstract class CartItemComponent {
  abstract getId(): number;
  abstract getName(): string;
  abstract getPrice(): number;
  abstract getTotalPrice(): number;
}

export class FoodCartItem extends CartItemComponent {
  // Implementation for food items
}

export class DealCartItem extends CartItemComponent {
  // Implementation for deal items
}
```

### Decorator Pattern Example

```typescript
// In HalalBadge.tsx
export function HalalBadge({ dealId, foodId }: Props) {
  const [status, setStatus] = useState<'halal' | 'not-halal' | 'verifying' | 'unknown'>('unknown');

  // Decorates food/deal items with halal status badge
  return (
    <div className={`badge badge-${status}`}>
      {status === 'halal' && '✓ Halal'}
      {status === 'not-halal' && '✗ Not Halal'}
      {status === 'verifying' && '⏳ Verifying'}
      {status === 'unknown' && '? Unknown'}
    </div>
  );
}
```

### Unit of Work Pattern Example

```typescript
// In MenuItemService
export class MenuItemService {
  private foodRepository: FoodRepository;
  private foodDetailRepository: FoodDetailRepository;

  async createFoodWithDetails(
    food: Food,
    details: FoodDetail[],
  ): Promise<number> {
    // Coordinate both repositories
    const foodId = await this.foodRepository.create(food);
    for (const detail of details) {
      await this.foodDetailRepository.create(foodId, detail);
    }
    return foodId;
  }
}
```

---

## Database Tables Used by Patterns

| Table                      | Pattern                       | Service                                        |
| -------------------------- | ----------------------------- | ---------------------------------------------- |
| `users`                    | Repository                    | UserProfileService, AllergiesService           |
| `food`                     | Repository, Strategy          | CalorieCalculatorService, FoodService          |
| `food_details`             | Repository, Strategy          | CalorieCalculatorService, HalalVerifierService |
| `deals`                    | Repository, Command           | OrderService, CartService                      |
| `deal_items`               | Repository                    | HalalVerifierService, CalorieCalculatorService |
| `shopping_carts`           | Repository, Composite         | CartService                                    |
| `cart_items`               | Repository, Composite         | CartService                                    |
| `orders`                   | Repository, Command, Observer | OrderService                                   |
| `order_items`              | Repository                    | OrderService                                   |
| `user_calory`              | Repository, Observer          | CalorieTrackerService                          |
| `calorie_log`              | Repository                    | CalorieTrackerService                          |
| `grocery_lists`            | Repository                    | GroceryService                                 |
| `grocery_items`            | Repository, Strategy          | GroceryService, BudgetPlanningService          |
| `halal_verification_cache` | Repository, Caching           | HalalVerifierService                           |

---

## API Endpoints by Pattern

| Endpoint                   | Pattern                                  | Service                  |
| -------------------------- | ---------------------------------------- | ------------------------ |
| `/api/user-calory`         | Factory, Strategy, Repository            | CalorieCalculatorService |
| `/api/user-profile`        | Factory, Repository, Observer            | UserProfileService       |
| `/api/user-allergies`      | Factory, Repository, Observer            | AllergiesService         |
| `/api/verify-halal`        | Factory, Repository, Observer, Decorator | HalalVerifierService     |
| `/api/cart`                | Composite, Command, Factory              | CartService              |
| `/api/orders/create`       | Command, Strategy, Repository            | OrderService             |
| `/api/grocery`             | Strategy, Command, Repository            | GroceryService           |
| `/api/budget/fetch-prices` | Strategy, Command                        | BudgetPlanningService    |
| `/api/create-food`         | Unit of Work, Repository                 | MenuItemService          |
| `/api/all-foods`           | Strategy, Factory                        | FoodService              |

---

## Key Takeaways

1. **Factory Pattern** ensures single repository instances across the app
2. **Strategy Pattern** provides flexible algorithm selection
3. **Repository Pattern** abstracts all data access
4. **Observer Pattern** enables real-time reactive updates
5. **Command Pattern** encapsulates operations for cart, orders, and budget
6. **Composite Pattern** unifies food and deal handling
7. **Decorator Pattern** adds halal badges without modifying items
8. **Unit of Work Pattern** coordinates multiple repositories
9. **Caching** improves performance at service level
10. **Layered Architecture** ensures clean separation of concerns

All patterns work together to create a **maintainable**, **testable**, and **scalable** application.
