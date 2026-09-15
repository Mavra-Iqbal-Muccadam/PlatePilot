# PlatePilot - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features & Design Patterns](#features--design-patterns)
3. [Architecture](#architecture)
4. [File Structure](#file-structure)
5. [Design Patterns Reference](#design-patterns-reference)

---

## Project Overview

**PlatePilot** is a comprehensive full-stack Next.js application that combines:
- Restaurant management and food delivery
- User nutrition tracking and calorie management
- AI-powered meal recommendations
- Sustainable dining features
- Halal verification system
- Budget planning an Coordinate multiple repositories

This architecture ensures the application is maintainable, testable, scalable, and follows SOLID principles.
3. **Factory Pattern**: All services use factories for singleton repository instances
4. **Observer Pattern**: Real-time updates across the application
5. **Strategy Pattern**: Flexible algorithms for different scenarios
6. **Repository Pattern**: Consistent data access abstraction
7. **Command Pattern**: Encapsulated operations for cart, orders, and budget
8. **Composite Pattern**: Unified interface for food and deals
9. **Decorator Pattern**: Dynamic behavior addition (halal badges)
10. **Unit of Work Pattern**:Authentication support

### OpenRouter API (Qwen 2.5 72B)
- Halal verification
- Diet plan generation
- Ingredient price fetching
- Healthy dish generation
- Sustainable meal creation
- Deal creation with AI

### JWT Authentication
- Token-based auth for restaurants
- Stateless authentication

---

## Key Takeaways

1. **Layered Architecture**: Clear separation between UI, services, repositories, and data layers
2. **Design Patterns**: 9 different patterns used for flexibility, maintainability, and scalability
unch INTEGER DEFAULT 0,
  dinner INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  restaurant_id INTEGER,
  total_amount DECIMAL,
  status VARCHAR(50),
  delivery_address TEXT,
  phone_number VARCHAR(20),
  special_instructions TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## External Integrations

### Supabase
- PostgreSQL database
- Real-time synchronization
- File storage
- ,
  updated_at TIMESTAMP
);
```

### Food Table
```sql
CREATE TABLE food (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL,
  allergies TEXT[],
  image_url TEXT,
  total_calories INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

### User Calory Table
```sql
CREATE TABLE user_calory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  current_calory INTEGER DEFAULT 0,
  limit_calory INTEGER DEFAULT 2000,
  breakfast INTEGER DEFAULT 0,
  ltem-service.ts

### 9. Singleton Pattern
**Purpose**: Ensure single instance of a class
**Used In**: All factories
**Benefits**: Consistency, memory efficiency
**Files**: All service files (via factories)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  profile_image TEXT,
  age INTEGER,
  weight DECIMAL,
  profession VARCHAR(255),
  allergies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPniformly
**Used In**: Cart management (food and deals)
**Benefits**: Unified interface, simplified client code
**File**: cart-service.ts

### 7. Decorator Pattern
**Purpose**: Add behavior to objects dynamically
**Used In**: Halal badge on food/deal items
**Benefits**: Flexible, non-invasive, composable
**File**: components/HalalBadge.tsx

### 8. Unit of Work Pattern
**Purpose**: Coordinate multiple repositories
**Used In**: Menu item service
**Benefits**: Transaction management, consistency
**File**: menu-iose coupling, reactive UI
**Files**: user-profile-service.ts, allergies-service.ts, halal-verifier.ts, order-service.ts

### 5. Command Pattern
**Purpose**: Encapsulate operations as objects
**Used In**: Cart operations, order creation, budget generation, grocery management
**Benefits**: Undo/redo capability, operation queuing, logging
**Files**: cart-service.ts, order-service.ts, budget-planning-service.ts, grocery-service.ts

### 6. Composite Pattern
**Purpose**: Treat individual objects and compositions u**: Flexible, extensible, testable
**Files**: calorie-calculator.ts, food-service.ts, budget-planning-service.ts, grocery-service.ts

### 3. Repository Pattern
**Purpose**: Abstract data access layer
**Used In**: All services
**Benefits**: Decoupling, testability, consistency
**Files**: All service files, repositories/ folder

### 4. Observer Pattern
**Purpose**: Notify subscribers of state changes
**Used In**: User profile, allergies, halal verifier, order service, calorie tracker
**Benefits**: Real-time updates, loet/*
- Utilities: upload-image, user-favourites

---

## Design Patterns Reference

### 1. Factory Pattern
**Purpose**: Create singleton instances of repositories
**Used In**: All services (CalorieRepositoryFactory, UserProfileRepositoryFactory, etc.)
**Benefits**: Single instance, lazy initialization, consistency
**File**: Each service file

### 2. Strategy Pattern
**Purpose**: Select different algorithms at runtime
**Used In**: Calorie calculation, food display, budget pricing, grocery extraction
**Benefits
- User: user-profile*, user-allergies, user-calory
- Food: all-foods, search-food, create-food, delete-food, toggle-food-status
- Deals: generate-deals, public-deals, restaurant-deals, toggle-deal-status, update-deal-price
- Cart: cart/*, cart/items/*
- Orders: orders/*, orders/create, orders/user, orders/restaurant, orders/update-status
- Health: check-meal-allergies, verify-halal, health-food-recommendations
- AI: generate-diet-plan, generate-healthy-dish, generate-sustainable-dish
- Grocery: grocery/*, budgergy warnings
- `HalalBadge.tsx` - Halal badge (Decorator)
- `OrderCart.tsx` - Shopping cart
- `GroceryList.tsx` - Grocery list display

### Pages (`app/`)
- User pages: login, dashboard, diet-plan, make-healthy, sustainable-meal, browse-restaurants, my-orders, grocery
- Restaurant pages: restaurent, restaurent-dashboard, add-food, restaurant-menu, restaurant-orders, ai-deal-maker
- Shared pages: browse-deals, all-foods, calorie-test, camera-test

### API Routes (`app/api/`)
- Authentication: user-auth/*, auth/loginRepositories (`lib/repositories/`)
- `menu-item-repository.ts` - Food and food details CRUD
- `food-repository.ts` - Food search and retrieval

### Commands (`lib/commands/`)
- `upload-command.ts` - Image upload
- `pdf-generator-command.ts` - PDF generation
- `healthy-menu-command.ts` - Healthy menu generation

### Components (`components/`)
- `SimpleCalorieCounter.tsx` - Calorie display
- `UserProfileEditor.tsx` - Profile editing
- `AllergiesSelector.tsx` - Allergy selection
- `MealAllergyChecker.tsx` - Allervice.ts` - Factory + Repository + Observer
- `allergies-service.ts` - Factory + Repository + Observer
- `halal-verifier.ts` - Factory + Repository + Observer + Decorator
- `cart-service.ts` - Repository + Composite + Factory + Command
- `order-service.ts` - Command + Repository + Observer
- `grocery-service.ts` - Strategy + Command + Repository
- `budget-planning-service.ts` - Strategy + Command + Repository
- `menu-item-service.ts` - Unit of Work + Repository
- `food-service.ts` - Strategy + Factory

###  (Add Behavior)         │
└─────────────────────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Behavioral Patterns             │
│  - Strategy (Algorithm Selection)   │
│  - Observer (Event Notification)    │
│  - Unit of Work (Coordination)      │
└─────────────────────────────────────┘
```

---

## File Structure

### Services (`lib/services/`)
- `calorie-calculator.ts` - Strategy + Factory + Repository
- `calorie-tracker-service.ts` - Strategy + Observer
- `user-profile-s  │
│  - grocery_items table              │
└─────────────────────────────────────┘
```

### Design Pattern Hierarchy

```
┌─────────────────────────────────────┐
│     Creational Patterns             │
│  - Factory (Singleton)              │
│  - Command (Encapsulation)          │
└─────────────────────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Structural Patterns             │
│  - Repository (Abstraction)         │
│  - Composite (Unified Interface)    │
│  - Decoratorository          │
│  - SupabaseCartRepository           │
│  - SupabaseOrderRepository          │
│  - SupabaseGroceryRepository        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Data Layer                      │
│  (Supabase PostgreSQL)              │
│  - users table                      │
│  - food table                       │
│  - deals table                      │
│  - orders table                     │
│  - user_calory table                - HalalVerifierService             │
│  - CartService                      │
│  - OrderService                     │
│  - GroceryService                   │
│  - BudgetPlanningService            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Repository Layer                │
│  (Data Access Abstraction)          │
│  - SupabaseCalorieRepository        │
│  - SupabaseUserProfileRepository    │
│  - SupabaseAllergiesRepository      │
│  - SupabaseHalalReps abstraction
- JWT: Stateless authentication

---

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────┐
│     UI Components (React)           │
│  (Pages, Components, Screens)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Services Layer                  │
│  (Business Logic, Patterns)         │
│  - CalorieCalculatorService         │
│  - UserProfileService               │
│  - AllergiesService                 │
│p/restaurent/page.tsx` - Restaurant login page
- `app/api/user-auth/login/route.ts` - User login API
- `app/api/user-auth/signup/route.ts` - User signup API
- `app/api/auth/login/route.ts` - Restaurant login API
- `lib/auth/jwt-auth.ts` - JWT authentication helpers

**How It Works**:
1. User/restaurant enters credentials
2. Validated against database
3. JWT token generated and stored
4. Token used for subsequent requests
5. Profile image upload during signup

**Why These Patterns**:
- Repository: Data accesutrition
   - Sustainability improvements
4. Results displayed with images and details

**Why These Patterns**:
- Strategy: Different generation approaches
- Command: Encapsulate generation operations
- LLM: AI-powered alternatives

---

### 12. AUTHENTICATION SYSTEM

**Purpose**: User and restaurant authentication

**Design Patterns Used**:
- **Repository Pattern**: User/restaurant data access
- **JWT Pattern**: Token-based authentication

**Files**:
- `app/user-login/page.tsx` - User login/signup page
- `ap meal generator
- `app/sustainable-results/page.tsx` - Display sustainable alternatives
- `app/api/generate-healthy-dish/route.ts` - Generate healthy dish API
- `app/api/generate-sustainable-dish/route.ts` - Generate sustainable dish API
- `lib/commands/healthy-menu-command.ts` - Healthy menu command

**How It Works**:
1. User selects a meal
2. Sends to Qwen AI with request for healthier/sustainable alternative
3. Qwen returns modified recipe with:
   - Ingredient substitutions
   - Reduced calories
   - Better nLM: AI-powered suggestions

---

### 11. HEALTHY & SUSTAINABLE MEAL GENERATION

**Purpose**: Generate healthier and sustainable meal alternatives

**Design Patterns Used**:
- **Strategy Pattern**: Different generation strategies
- **Command Pattern**: Meal generation commands
- **LLM Integration**: Qwen AI for alternatives

**Files**:
- `app/make-healthy/page.tsx` - Healthy meal generator page
- `app/make-healthy-results/page.tsx` - Display healthy alternatives
- `app/sustainable-meal/page.tsx` - Sustainableute.ts` - Update deal price
- `app/view-restaurant-deals/page.tsx` - View deals page

**How It Works**:
1. Restaurant inputs deal parameters
2. Qwen AI generates deal suggestions
3. Deal created with calculated total calories
4. Halal badge added to deals
5. Calorie tracking integrated when user adds deal to cart
6. Restaurant can toggle deal status and update prices

**Why These Patterns**:
- Command: Encapsulate deal operations
- Strategy: Different pricing approaches
- Repository: Data access abstraction
- Lsistance

**Design Patterns Used**:
- **Command Pattern**: Deal creation commands
- **Strategy Pattern**: Deal pricing strategies
- **Repository Pattern**: Deal data access
- **LLM Integration**: Qwen AI for deal suggestions

**Files**:
- `app/ai-deal-maker/page.tsx` - AI deal maker page
- `app/api/generate-deals/route.ts` - Generate deals with AI
- `app/api/restaurant-deals/route.ts` - Get restaurant deals
- `app/api/toggle-deal-status/route.ts` - Toggle deal active/inactive
- `app/api/update-deal-price/ros
3. FoodService provides different display strategies
4. GridDisplayStrategy for grid layout
5. ListDisplayStrategy for list layout
6. SearchResultsDisplayStrategy for search results
7. Strategies can be switched dynamically

**Why These Patterns**:
- Strategy: Different display formats
- Factory: Single service instances
- Repository: Data access abstraction
- Unit of Work: Coordinate multiple repositories

---

### 10. DEAL MANAGEMENT & AI DEAL MAKER

**Purpose**: Create and manage restaurant deals with AI as `lib/repositories/food-repository.ts` - Food repository
- `app/api/create-food/route.ts` - Create food API
- `app/api/all-foods/route.ts` - Get all foods API
- `app/api/search-food/route.ts` - Search foods API
- `app/add-food/page.tsx` - Add food page (restaurant)
- `app/restaurant-menu/page.tsx` - Restaurant menu page
- `app/all-foods/page.tsx` - Browse all foods page

**How It Works**:
1. Restaurant creates food via MenuItemService (Unit of Work)
2. MenuItemService coordinates food and food_details repositorietern**: GridDisplayStrategy, ListDisplayStrategy, SearchResultsDisplayStrategy
- **Factory Pattern**: FoodServiceFactory, MenuItemRepositoryFactory
- **Repository Pattern**: MenuItemRepository, FoodRepository
- **Unit of Work Pattern**: MenuItemService coordinates multiple repositories

**Files**:
- `lib/services/menu-item-service.ts` - Menu item service (Unit of Work)
- `lib/services/food-service.ts` - Food service with display strategies
- `lib/repositories/menu-item-repository.ts` - Menu item repository
- fetches prices from Qwen AI
4. Calculates total budget and category breakdowns
5. GenerateBudgetPDFCommand creates downloadable PDF
6. User can toggle purchased items and clear list

**Why These Patterns**:
- Strategy: Different ingredient extraction methods
- Command: Encapsulate budget operations
- Factory: Single service instance
- Repository: Data access abstraction

---

### 9. FOOD & MENU MANAGEMENT

**Purpose**: Create, manage, and display restaurant menus

**Design Patterns Used**:
- **Strategy Patery service
- `lib/services/budget-planning-service.ts` - Budget planning service
- `lib/commands/pdf-generator-command.ts` - PDF generation command
- `app/grocery/page.tsx` - Grocery list page
- `app/api/grocery/route.ts` - Grocery API
- `app/api/budget/fetch-prices/route.ts` - Fetch ingredient prices (Qwen)
- `app/api/budget/generate-pdf/route.ts` - Generate budget PDF

**How It Works**:
1. User adds food to grocery list
2. GroceryService extracts ingredients using Strategy Pattern
3. BudgetPlanningService
- Strategy: Flexible validation logic
- Repository: Data access abstraction

---

### 8. GROCERY LIST & BUDGET PLANNING

**Purpose**: Manage grocery lists and plan budgets

**Design Patterns Used**:
- **Strategy Pattern**: FoodDetailsExtractionStrategy, AIIngredientExtractionStrategy
- **Command Pattern**: AddIngredientsCommand, RemoveItemCommand
- **Repository Pattern**: SupabaseGroceryRepository
- **Factory Pattern**: GroceryServiceFactory creates singleton

**Files**:
- `lib/services/grocery-service.ts` - Groc- User order history page
- `app/restaurant-orders/page.tsx` - Restaurant order management

**How It Works**:
1. CreateOrderCommand validates order data
2. Calculates total using UnifiedOrderStrategy
3. Creates order in database
4. Automatically adds calories to user_calory table
5. UpdateOrderStatusCommand updates order status
6. Observers notified of status changes
7. Restaurant can track orders in real-time

**Why These Patterns**:
- Command: Encapsulate order operations
- Observer: Real-time status updatesabaseOrderRepository handles data access
- **Observer Pattern**: Notify of order status changes
- **Strategy Pattern**: Different order validation strategies

**Files**:
- `lib/services/order-service.ts` - Order service with Command pattern
- `app/api/orders/create/route.ts` - Create order API
- `app/api/orders/user/route.ts` - Get user orders API
- `app/api/orders/restaurant/route.ts` - Get restaurant orders API
- `app/api/orders/update-status/route.ts` - Update order status API
- `app/my-orders/page.tsx` egrated: when item removed, calories subtracted
7. localStorage tracks which items were marked for calorie tracking

**Why These Patterns**:
- Composite: Unified interface for food and deals
- Command: Encapsulate cart operations
- Factory: Single service instance
- Repository: Data access abstraction

---

### 7. ORDER MANAGEMENT SYSTEM

**Purpose**: Create and manage orders from cart

**Design Patterns Used**:
- **Command Pattern**: CreateOrderCommand, UpdateOrderStatusCommand
- **Repository Pattern**: Suprt-service.ts` - Cart service with Composite & Command patterns
- `components/OrderCart.tsx` - Cart UI component
- `app/api/cart/route.ts` - Cart API endpoints
- `app/api/cart/items/route.ts` - Cart items API

**How It Works**:
1. CartService uses Composite Pattern to treat food and deals uniformly
2. FoodCartItem and DealCartItem extend CartItemComponent
3. Commands encapsulate cart operations (add, remove, update)
4. Factory creates singleton CartService
5. Cart grouped by restaurant
6. Calorie tracking ints for different users
- Repository: Centralized user data access
- LLM: AI-powered personalization

---

### 6. CART MANAGEMENT SYSTEM

**Purpose**: Unified shopping cart for both food items and deals

**Design Patterns Used**:
- **Repository Pattern**: SupabaseCartRepository handles data access
- **Composite Pattern**: Treat food and deals uniformly
- **Factory Pattern**: CartServiceFactory creates singleton
- **Command Pattern**: AddToCartCommand, RemoveFromCartCommand, etc.

**Files**:
- `lib/services/ca Sends comprehensive prompt to Qwen AI via OpenRouter
4. Qwen returns 12-section diet plan:
   - Personal Information
   - Daily Calorie Requirement
   - Dietary Restrictions
   - Nutrition Goals
   - Meal Plan (with Unsplash/Pexels image URLs)
   - Portion Sizes
   - Recommended Foods
   - Foods to Avoid
   - Hydration Plan
   - Lifestyle Tips
   - Weekly Progress Tips
   - Important Health Notes
5. Plan displayed with proper formatting and images

**Why These Patterns**:
- Strategy: Different diet approacheata access for user info
- **LLM Integration**: Qwen AI for plan generation

**Files**:
- `app/diet-plan/page.tsx` - Diet plan display page
- `app/api/generate-diet-plan/route.ts` - Diet plan generation API
- `app/api/user-profile/route.ts` - Fetch user profile for diet plan
- `components/SimpleCalorieCounter.tsx` - "Suggest Diet Plan" button

**How It Works**:
1. User clicks "Suggest Diet Plan" when calories exceeded
2. Page fetches user data: age, weight, profession, allergies, current calories, daily limit
3. halal), Yellow (verifying), Gray (unknown)
6. Observers notified when status changes

**Why These Patterns**:
- Factory: Single repository instance
- Decorator: Add halal badge to any item
- Observer: Real-time status updates
- Caching: Reduce API calls to Qwen
- Repository: Data access abstraction

---

### 5. DIET PLAN GENERATION

**Purpose**: Generate personalized diet plans based on user profile

**Design Patterns Used**:
- **Strategy Pattern**: Different diet plan strategies
- **Repository Pattern**: DalalBadge.tsx` - Badge component (Decorator Pattern)
- `app/api/verify-halal/route.ts` - Halal verification API (uses Qwen)
- `app/view-restaurant-deals/page.tsx` - Deals page with halal badges
- `src/screens/FoodDetails.tsx` - Food details with halal badge

**How It Works**:
1. HalalBadge component decorates food/deal items
2. On first view, HalalVerifierService fetches ingredients
3. Sends to Qwen AI: "Is this halal? Answer only yes or no"
4. Result cached for 24 hours
5. Badge colors: Green (halal), Red (nottion

---

### 4. HALAL VERIFICATION SYSTEM

**Purpose**: Verify if meals are halal using AI

**Design Patterns Used**:
- **Factory Pattern**: HalalRepositoryFactory creates singleton
- **Repository Pattern**: SupabaseHalalRepository handles data access
- **Observer Pattern**: Notify of halal status changes
- **Decorator Pattern**: HalalBadge decorates food/deal items
- **Caching**: 24-hour cache for verification results

**Files**:
- `lib/services/halal-verifier.ts` - Halal verification service
- `components/Hned allergies + "Other" option
2. Selected allergies stored in `users.allergies` array
3. AllergiesService uses Factory for singleton repository
4. When viewing food, MealAllergyChecker compares user allergies with meal allergies
5. If match found, red warning displayed and "Add to Cart" disabled
6. Uses Qwen AI to determine allergen matches

**Why These Patterns**:
- Factory: Single repository instance
- Observer: Real-time allergy updates
- Caching: Performance optimization
- Repository: Data access abstracitory handles data access
- **Observer Pattern**: Notify of allergy changes
- **Caching**: In-memory allergy cache

**Files**:
- `lib/services/allergies-service.ts` - Allergies service with Factory
- `components/AllergiesSelector.tsx` - Dropdown with 35+ allergies
- `app/api/user-allergies/route.ts` - Get/update allergies API
- `app/api/check-meal-allergies/route.ts` - Check meal for allergens
- `components/MealAllergyChecker.tsx` - Display allergy warnings

**How It Works**:
1. AllergiesSelector shows 35+ predefi 21+ options + "Other" text field
5. Age, weight fields for health tracking

**Why These Patterns**:
- Factory: Ensures single repository instance
- Observer: Reactive updates across app
- Caching: Reduces database queries
- Repository: Clean separation of concerns

---

### 3. ALLERGIES MANAGEMENT SYSTEM

**Purpose**: Track user allergies and check meals for allergens

**Design Patterns Used**:
- **Factory Pattern**: AllergiesRepositoryFactory creates singleton
- **Repository Pattern**: SupabaseAllergiesReposerformance

**Files**:
- `lib/services/user-profile-service.ts` - Profile service with Factory
- `components/UserProfileEditor.tsx` - UI for editing profile
- `app/api/user-profile/route.ts` - Get user profile API
- `app/api/user-profile-update/route.ts` - Update profile API
- `src/screens/Profile.tsx` - Profile page

**How It Works**:
1. UserProfileService uses Factory to get singleton repository
2. Profile cached in-memory for performance
3. Updates trigger observer notifications
4. Profession dropdown withconsistency
- Observer: Real-time UI updates when calories change
- Repository: Decouples business logic from data access

---

### 2. USER PROFILE MANAGEMENT

**Purpose**: Store and manage user information (age, weight, profession, allergies)

**Design Patterns Used**:
- **Factory Pattern**: UserProfileRepositoryFactory creates singleton
- **Repository Pattern**: SupabaseUserProfileRepository handles data access
- **Observer Pattern**: Notify subscribers of profile changes
- **Caching**: In-memory cache for pts` - Calorie tracking API

**How It Works**:
1. User adds food/deal to cart → calories calculated via Strategy Pattern
2. CalorieCalculatorService uses Factory to get singleton repository
3. Calories stored in `user_calory` table
4. SimpleCalorieCounter displays current vs limit
5. When exceeded, "Suggest Diet Plan" button appears
6. Observers notified of limit exceeded event

**Why These Patterns**:
- Strategy: Flexible calculation methods (direct vs detailed)
- Factory: Single repository instance ensures ry Pattern**: SupabaseCalorieRepository abstracts data access
- **Observer Pattern**: Notify when calorie limit exceeded

**Files**:
- `lib/services/calorie-calculator.ts` - Core calorie calculation service
- `lib/services/calorie-tracker-service.ts` - Calorie tracking operations
- `components/SimpleCalorieCounter.tsx` - UI component for calorie display
- `components/EnhancedCalorieTracker.tsx` - Advanced tracker UI
- `app/api/user-calory/route.ts` - API endpoint for calorie data
- `app/api/calorie-tracker/route.d grocery management

**Tech Stack**: Next.js 16.2.3, React 19.2.4, TypeScript, Tailwind CSS, Supabase, OpenRouter API (Qwen AI)

---

## Features & Design Patterns

### 1. CALORIE TRACKING SYSTEM

**Purpose**: Track user daily calorie intake with limits and meal-specific tracking

**Design Patterns Used**:
- **Strategy Pattern**: Different calculation strategies (DirectFoodCalorieStrategy, DetailedFoodCalorieStrategy)
- **Factory Pattern**: CalorieRepositoryFactory creates singleton repository
- **Reposito