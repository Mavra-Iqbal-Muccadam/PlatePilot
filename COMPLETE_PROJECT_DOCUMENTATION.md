# PlatePilot - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features with Design Patterns](#core-features-with-design-patterns)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)

---

## Project Overview

**PlatePilot** is a comprehensive full-stack Next.js 16.2.3 application combining:
- Restaurant management and food delivery
- User nutrition tracking and calorie management
- AI-powered meal recommendations (Qwen 2.5 72B via OpenRouter)
- Sustainable dining features
- Halal verification system
- Budget planning and grocery management

**Database**: Supabase (PostgreSQL)
**Frontend**: React 19.2.4, TypeScript, Tailwind CSS 4
**Backend**: Next.js API Routes
**AI Integration**: OpenRouter API (Qwen 2.5 72B Instruct)

---

## Core Features with Design Patterns

### FEATURE 1: CALORIE TRACKING SYSTEM

**What It Does**: Tracks user daily calorie intake with daily limits and meal-specific tracking

**Design Patterns Used**:
1. **Strategy Pattern** - Different calculation strategies
2. **Factory Pattern** - Singleton repository creation
3. **Repository Pattern** - Data access abstraction
4. **Observer Pattern** - Notify when limit exceeded

**How It Works**:
- User adds food/deal to cart
- CalorieCalculatorService calculates calories using Strategy Pattern
- Two strategies: DirectFoodCalorieStrategy (from food.total_calories) or DetailedFoodCalorieStrategy (sum of food_details)
- Factory creates singleton SupabaseCalorieRepository
- Calories stored in user_calory table
- SimpleCalorieCounter displays current vs limit
- When exceeded, "Suggest Diet Plan" button appears
- Observers notified of limit exceeded event

**File Paths**:
- `lib/services/calorie-calculator.ts` - Strategy + Factory + Repository
- `lib/services/calorie-tracker-service.ts` - Calorie tracking operations
- `components/SimpleCalorieCounter.tsx` - UI component (bottom-right corner)
- `components/EnhancedCalorieTracker.tsx` - Advanced tracker UI
- `app/api/user-calory/route.ts` - GET/PUT calorie data
- `app/api/calorie-tracker/route.ts` - Calorie tracking API
- `components/LayoutWrapper.tsx` - Integrates counter into all pages

**Why These Patterns**:
- Strategy: Flexible calculation methods (direct vs detailed from ingredients)
- Factory: Single repository instance ensures consistency across app
- Observer: Real-time UI updates when calories change
- Repository: Decouples business logic from Supabase queries

---

### FEATURE 2: USER PROFILE MANAGEMENT

**What It Does**: Store and manage user information (age, weight, profession, allergies)

**Design Patterns Used**:
1. **Factory Pattern** - Singleton repository creation
2. **Repository Pattern** - Data access abstraction
3. **Observer Pattern** - Notify of profile changes
4. **Caching** - In-memory cache for performance

**How It Works**:
- UserProfileService uses Factory to get singleton repository
- Profile cached in-memory for performance
- Updates trigger observer notifications
- Profession dropdown with 21+ options + "Other" text field
- Age, weight fields for health tracking
- Profile image upload support

**File Paths**:
- `lib/services/user-profile-service.ts` - Factory + Repository + Observer
- `components/UserProfileEditor.tsx` - UI for editing profile
- `app/api/user-profile/route.ts` - GET user profile
- `app/api/user-profile-update/route.ts` - PUT update profile
- `src/screens/Profile.tsx` - Profile page

**Why These Patterns**:
- Factory: Ensures single repository instance
- Observer: Reactive updates across app
- Caching: Reduces database queries
- Repository: Clean separation of concerns

---

### FEATURE 3: ALLERGIES MANAGEMENT

**What It Does**: Track user allergies and check meals for allergens

**Design Patterns Used**:
1. **Factory Pattern** - Singleton repository creation
2. **Repository Pattern** - Data access abstraction
3. **Observer Pattern** - Notify of allergy changes
4. **Caching** - In-memory allergy cache

**How It Works**:
- AllergiesSelector shows 35+ predefined allergies + "Other" option
- Selected allergies stored in users.allergies array
- AllergiesService uses Factory for singleton repository
- When viewing food, MealAllergyChecker compares user allergies with meal allergies
- If match found, red warning displayed and "Add to Cart" disabled
- Uses Qwen AI to determine allergen matches

**File Paths**:
- `lib/services/allergies-service.ts` - Factory + Repository + Observer
- `components/AllergiesSelector.tsx` - Dropdown with 35+ allergies
- `app/api/user-allergies/route.ts` - GET/PUT allergies
- `app/api/check-meal-allergies/route.ts` - Check meal for allergens (Qwen AI)
- `components/MealAllergyChecker.tsx` - Display allergy warnings
- `src/screens/FoodDetails.tsx` - Integrated allergy checker

**Why These Patterns**:
- Factory: Single repository instance
- Observer: Real-time allergy updates
- Caching: Performance optimization
- Repository: Data access abstraction

---

### FEATURE 4: HALAL VERIFICATION SYSTEM

**What It Does**: Verify if meals are halal using AI

**Design Patterns Used**:
1. **Factory Pattern** - Singleton repository creation
2. **Repository Pattern** - Data access abstraction
3. **Observer Pattern** - Notify of halal status changes
4. **Decorator Pattern** - HalalBadge decorates items
5. **Caching** - 24-hour cache for verification results

**How It Works**:
- HalalBadge component decorates food/deal items
- On first view, HalalVerifierService fetches ingredients from food_details table
- Sends to Qwen AI: "Is this halal? Answer only yes or no"
- Result cached for 24 hours in halal_verification_cache table
- Badge colors: Green (halal), Red (not halal), Yellow (verifying), Gray (unknown)
- Observers notified when status changes
- If ANY ingredient is not halal, entire dish is not halal

**File Paths**:
- `lib/services/halal-verifier.ts` - Factory + Repository + Observer + Decorator
- `components/HalalBadge.tsx` - Badge component (Decorator Pattern)
- `app/api/verify-halal/route.ts` - Halal verification API (Qwen)
- `app/view-restaurant-deals/page.tsx` - Deals page with halal badges
- `src/screens/FoodDetails.tsx` - Food details with halal badge

**Why These Patterns**:
- Factory: Single repository instance
- Decorator: Add halal badge to any item without modifying original
- Observer: Real-time status updates
- Caching: Reduce API calls to Qwen
- Repository: Data access abstraction

---

### FEATURE 5: DIET PLAN GENERATION

**What It Does**: Generate personalized diet plans based on user profile

**Design Patterns Used**:
1. **Strategy Pattern** - Different diet plan strategies
2. **Repository Pattern** - Data access for user info
3. **LLM Integration** - Qwen AI for plan generation

**How It Works**:
- User clicks "Suggest Diet Plan" when calories exceeded
- Page fetches user data: age, weight, profession, allergies, current calories, daily limit
- Sends comprehensive prompt to Qwen AI via OpenRouter
- Qwen returns 12-section diet plan with meal images from Unsplash/Pexels
- Plan displayed with proper formatting

**File Paths**:
- `app/diet-plan/page.tsx` - Diet plan display page
- `app/api/generate-diet-plan/route.ts` - Diet plan generation (Qwen)
- `app/api/user-profile/route.ts` - Fetch user profile
- `components/SimpleCalorieCounter.tsx` - "Suggest Diet Plan" button

**Why These Patterns**:
- Strategy: Different diet approaches for different users
- Repository: Centralized user data access
- LLM: AI-powered personalization

---

### FEATURE 6: CART MANAGEMENT

**What It Does**: Unified shopping cart for both food items and deals

**Design Patterns Used**:
1. **Repository Pattern** - Data access abstraction
2. **Composite Pattern** - Treat food and deals uniformly
3. **Factory Pattern** - Singleton service creation
4. **Command Pattern** - Encapsulate cart operations

**How It Works**:
- CartService uses Composite Pattern to treat food and deals uniformly
- FoodCartItem and DealCartItem extend CartItemComponent
- Commands encapsulate cart operations (add, remove, update)
- Factory creates singleton CartService
- Cart grouped by restaurant
- Calorie tracking integrated: when item removed, calories subtracted
- localStorage tracks which items were marked for calorie tracking

**File Paths**:
- `lib/services/cart-service.ts` - Composite + Command + Factory
- `components/OrderCart.tsx` - Cart UI component
- `app/api/cart/route.ts` - Cart API endpoints
- `app/api/cart/items/route.ts` - Cart items API

**Why These Patterns**:
- Composite: Unified interface for food and deals
- Command: Encapsulate cart operations
- Factory: Single service instance
- Repository: Data access abstraction

---

### FEATURE 7: ORDER MANAGEMENT

**What It Does**: Create and manage orders from cart

**Design Patterns Used**:
1. **Command Pattern** - CreateOrderCommand, UpdateOrderStatusCommand
2. **Repository Pattern** - Data access abstraction
3. **Observer Pattern** - Notify of order status changes
4. **Strategy Pattern** - Order validation strategies

**How It Works**:
- CreateOrderCommand validates order data
- Calculates total using UnifiedOrderStrategy
- Creates order in database
- Automatically adds calories to user_calory table
- UpdateOrderStatusCommand updates order status
- Observers notified of status changes
- Restaurant can track orders in real-time

**File Paths**:
- `lib/services/order-service.ts` - Command + Repository + Observer
- `app/api/orders/create/route.ts` - Create order API
- `app/api/orders/user/route.ts` - Get user orders
- `app/api/orders/restaurant/route.ts` - Get restaurant orders
- `app/api/orders/update-status/route.ts` - Update order status
- `app/my-orders/page.tsx` - User order history
- `app/restaurant-orders/page.tsx` - Restaurant order management

**Why These Patterns**:
- Command: Encapsulate order operations
- Observer: Real-time status updates
- Strategy: Flexible validation logic
- Repository: Data access abstraction

---

### FEATURE 8: GROCERY LIST & BUDGET PLANNING

**What It Does**: Manage grocery lists and plan budgets

**Design Patterns Used**:
1. **Strategy Pattern** - Different ingredient extraction methods
2. **Command Pattern** - Encapsulate budget operations
3. **Repository Pattern** - Data access abstraction
4. **Factory Pattern** - Singleton service creation

**How It Works**:
- User adds food to grocery list
- GroceryService extracts ingredients using Strategy Pattern
- BudgetPlanningService fetches prices from Qwen AI
- Calculates total budget and category breakdowns
- GenerateBudgetPDFCommand creates downloadable PDF
- User can toggle purchased items and clear list

**File Paths**:
- `lib/services/grocery-service.ts` - Strategy + Command + Repository
- `lib/services/budget-planning-service.ts` - Budget planning service
- `lib/commands/pdf-generator-command.ts` - PDF generation
- `app/grocery/page.tsx` - Grocery list page
- `app/api/grocery/route.ts` - Grocery API
- `app/api/budget/fetch-prices/route.ts` - Fetch prices (Qwen)
- `app/api/budget/generate-pdf/route.ts` - Generate PDF

**Why These Patterns**:
- Strategy: Different ingredient extraction methods
- Command: Encapsulate budget operations
- Factory: Single service instance
- Repository: Data access abstraction

---

### FEATURE 9: FOOD & MENU MANAGEMENT

**What It Does**: Create, manage, and display restaurant menus

**Design Patterns Used**:
1. **Strategy Pattern** - Different display strategies
2. **Factory Pattern** - Singleton service creation
3. **Repository Pattern** - Data access abstraction
4. **Unit of Work Pattern** - Coordinate multiple repositories

**How It Works**:
- Restaurant creates food via MenuItemService (Unit of Work)
- MenuItemService coordinates food and food_details repositories
- FoodService provides different display strategies
- GridDisplayStrategy for grid layout
- ListDisplayStrategy for list layout
- SearchResultsDisplayStrategy for search results
- Strategies can be switched dynamically

**File Paths**:
- `lib/services/menu-item-service.ts` - Unit of Work + Repository
- `lib/services/food-service.ts` - Strategy + Factory
- `lib/repositories/menu-item-repository.ts` - Menu item repository
- `lib/repositories/food-repository.ts` - Food repository
- `app/api/create-food/route.ts` - Create food API
- `app/api/all-foods/route.ts` - Get all foods
- `app/api/search-food/route.ts` - Search foods
- `app/add-food/page.tsx` - Add food page
- `app/restaurant-menu/page.tsx` - Restaurant menu
- `app/all-foods/page.tsx` - Browse all foods

**Why These Patterns**:
- Strategy: Different display formats
- Factory: Single service instances
- Repository: Data access abstraction
- Unit of Work: Coordinate multiple repositories

---

### FEATURE 10: DEAL MANAGEMENT & AI DEAL MAKER

**What It Does**: Create and manage restaurant deals with AI assistance

**Design Patterns Used**:
1. **Command Pattern** - Deal creation commands
2. **Strategy Pattern** - Deal pricing strategies
3. **Repository Pattern** - Deal data access
4. **LLM Integration** - Qwen AI for suggestions

**How It Works**:
- Restaurant inputs deal parameters
- Qwen AI generates deal suggestions
- Deal created with calculated total calories
- Halal badge added to deals
- Calorie tracking integrated when user adds deal to cart
- Restaurant can toggle deal status and update prices

**File Paths**:
- `app/ai-deal-maker/page.tsx` - AI deal maker page
- `app/api/generate-deals/route.ts` - Generate deals (Qwen)
- `app/api/restaurant-deals/route.ts` - Get restaurant deals
- `app/api/toggle-deal-status/route.ts` - Toggle deal status
- `app/api/update-deal-price/route.ts` - Update deal price
- `app/view-restaurant-deals/page.tsx` - View deals page

**Why These Patterns**:
- Command: Encapsulate deal operations
- Strategy: Different pricing approaches
- Repository: Data access abstraction
- LLM: AI-powered suggestions

---

### FEATURE 11: HEALTHY & SUSTAINABLE MEAL GENERATION

**What It Does**: Generate healthier and sustainable meal alternatives

**Design Patterns Used**:
1. **Strategy Pattern** - Different generation strategies
2. **Command Pattern** - Meal generation commands
3. **LLM Integration** - Qwen AI for alternatives

**How It Works**:
- User selects a meal
- Sends to Qwen AI with request for healthier/sustainable alternative
- Qwen returns modified recipe with ingredient substitutions
- Results displayed with images and details

**File Paths**:
- `app/make-healthy/page.tsx` - Healthy meal generator
- `app/make-healthy-results/page.tsx` - Display healthy alternatives
- `app/sustainable-meal/page.tsx` - Sustainable meal generator
- `app/sustainable-results/page.tsx` - Display sustainable alternatives
- `app/api/generate-healthy-dish/route.ts` - Generate healthy dish (Qwen)
- `app/api/generate-sustainable-dish/route.ts` - Generate sustainable (Qwen)
- `lib/commands/healthy-menu-command.ts` - Healthy menu command

**Why These Patterns**:
- Strategy: Different generation approaches
- Command: Encapsulate generation operations
- LLM: AI-powered alternatives

---

### FEATURE 12: AUTHENTICATION SYSTEM

**What It Does**: User and restaurant authentication

**Design Patterns Used**:
1. **Repository Pattern** - User/restaurant data access
2. **JWT Pattern** - Token-based authentication

**How It Works**:
- User/restaurant enters credentials
- Validated against database
- JWT token generated and stored
- Token used for subsequent requests
- Profile image upload during signup

**File Paths**:
- `app/user-login/page.tsx` - User login/signup page
- `app/restaurent/page.tsx` - Restaurant login page
- `app/api/user-auth/login/route.ts` - User login API
- `app/api/user-auth/signup/route.ts` - User signup API
- `app/api/auth/login/route.ts` - Restaurant login API
- `lib/auth/jwt-auth.ts` - JWT authentication helpers

**Why These Patterns**:
- Repository: Data access abstraction
- JWT: Stateless authentication

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────┐
│     UI Layer (React Components)     │
│  Pages, Components, Screens         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Services Layer                  │
│  Business Logic & Design Patterns   │
│  - CalorieCalculatorService         │
│  - UserProfileService               │
│  - AllergiesService                 │
│  - HalalVerifierService             │
│  - CartService                      │
│  - OrderService                     │
│  - GroceryService                   │
│  - BudgetPlanningService            │
│  - MenuItemService                  │
│  - FoodService                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Repository Layer                │
│  Data Access Abstraction            │
│  - SupabaseCalorieRepository        │
│  - SupabaseUserProfileRepository    │
│  - SupabaseAllergiesRepository      │
│  - SupabaseHalalRepository          │
│  - SupabaseCartRepository           │
│  - SupabaseOrderRepository          │
│  - SupabaseGroceryRepository        │
│  - SupabaseFoodRepository           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Data Layer                      │
│  Supabase PostgreSQL Database       │
│  - users, food, deals, orders       │
│  - user_calory, grocery_items       │
│  - shopping_carts, order_items      │
└─────────────────────────────────────┘
```

### Design Pattern Hierarchy

```
Creational Patterns:
├── Factory (Singleton) - All services
└── Command - Cart, Order, Budget, Grocery

Structural Patterns:
├── Repository - All services
├── Composite - Cart management
└── Decorator - Halal badge

Behavioral Patterns:
├── Strategy - Calorie calc, Food display, Budget, Grocery
├── Observer - Profile, Allergies, Halal, Orders, Calorie
└── Unit of Work - Menu item service
```

---

## Technology Stack

**Frontend**:
- Next.js 16.2.3
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Framer Motion (animations)
- React Icons

**Backend**:
- Next.js API Routes
- Node.js

**Database**:
- Supabase (PostgreSQL)
- Real-time synchronization

**AI/ML**:
- OpenRouter API
- Qwen 2.5 72B Instruct

**Authentication**:
- JWT (JSON Web Tokens)
- Supabase Auth

**Utilities**:
- jsPDF (PDF generation)
- face-api.js (image recognition)
- Supabase JS SDK

---

## Summary

PlatePilot uses **9 design patterns** across **12 major features**:

1. **Factory Pattern** - Singleton repository creation (all services)
2. **Strategy Pattern** - Algorithm selection (calorie calc, food display, budget, grocery)
3. **Repository Pattern** - Data access abstraction (all services)
4. **Observer Pattern** - Event notification (profile, allergies, halal, orders, calorie)
5. **Command Pattern** - Operation encapsulation (cart, orders, budget, grocery)
6. **Composite Pattern** - Unified interface (cart management)
7. **Decorator Pattern** - Dynamic behavior (halal badge)
8. **Unit of Work Pattern** - Repository coordination (menu items)
9. **Singleton Pattern** - Single instance (all factories)

This architecture ensures **maintainability**, **testability**, **scalability**, and adherence to **SOLID principles**.
