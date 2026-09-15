# Complete File Structure & Paths Reference

## Project Root Structure

```
food-app/
├── app/                          # Next.js app directory
├── components/                   # React components
├── lib/                          # Utilities and services
├── public/                       # Static assets
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
└── next.config.ts                # Next.js config
```

---

## Services Directory (`lib/services/`)

### Core Services with Design Patterns

| File | Patterns | Purpose |
|------|----------|---------|
| `calorie-calculator.ts` | Strategy, Factory, Repository | Calculate food/deal calories |
| `calorie-tracker-service.ts` | Strategy, Observer | Track daily calorie intake |
| `user-profile-service.ts` | Factory, Repository, Observer | Manage user profile data |
| `allergies-service.ts` | Factory, Repository, Observer | Manage user allergies |
| `halal-verifier.ts` | Factory, Repository, Observer, Decorator | Verify halal status |
| `cart-service.ts` | Repository, Composite, Factory, Command | Manage shopping cart |
| `order-service.ts` | Command, Repository, Observer | Create and manage orders |
| `grocery-service.ts` | Strategy, Command, Repository | Manage grocery lists |
| `budget-planning-service.ts` | Strategy, Command, Repository | Plan budgets |
| `menu-item-service.ts` | Unit of Work, Repository | Create menu items |
| `food-service.ts` | Strategy, Factory | Display foods |

---

## Repositories Directory (`lib/repositories/`)

| File | Purpose |
|------|---------|
| `menu-item-repository.ts` | Food CRUD operations |
| `food-repository.ts` | Food search and retrieval |

---

## Commands Directory (`lib/commands/`)

| File | Purpose |
|------|---------|
| `upload-command.ts` | Image upload operations |
| `pdf-generator-command.ts` | PDF generation |
| `healthy-menu-command.ts` | Healthy menu generation |
| `restaurant-profile-command.ts` | Restaurant profile operations |

---

## Components Directory (`components/`)

### Layout & Navigation
- `LayoutWrapper.tsx` - Main layout wrapper with calorie counter
- `ClientLayout.tsx` - Client-side layout
- `UserLayout.tsx` - User-specific layout
- `RestaurantNavbar.tsx` - Restaurant navigation
- `RestaurantFooter.tsx` - Restaurant footer
- `FloatingMenu.tsx` - Floating menu component

### User Features
- `UserProfileEditor.tsx` - Edit user profile (age, weight, profession)
- `AllergiesSelector.tsx` - Select/manage allergies (35+ options)
- `MealAllergyChecker.tsx` - Check meals for allergens

### Calorie Tracking
- `CalorieTracker.tsx` - Basic calorie tracker
- `EnhancedCalorieTracker.tsx` - Advanced calorie tracker
- `SimpleCalorieCounter.tsx` - Simple counter (bottom-right corner)
- `CaloriePanel.tsx` - Calorie display panel
- `CalorieTrackerTest.tsx` - Test component
- `GlobalCalorieTracker.tsx` - Global tracker state

### Food & Shopping
- `FoodSearchChat.tsx` - Chat-based food search
- `FoodSearchPanel.tsx` - Food search interface
- `GroceryList.tsx` - Grocery list display
- `OrderCart.tsx` - Shopping cart (original)
- `OrderCart.new.tsx` - Shopping cart (new version)

### Health & Recommendations
- `HealthChatPanel.tsx` - Health recommendation chat
- `HealthRecommendationChat.tsx` - Health chat interface
- `HalalBadge.tsx` - Display halal certification badge (Decorator Pattern)

### Testing
- `CameraTest.tsx` - Camera/image recognition test

---

## Pages Directory (`app/`)

### User Pages

#### Authentication & Profile
- `app/user-login/page.tsx` - User login/signup page
- `app/user-dashboard/page.tsx` - User profile and dashboard

#### Nutrition & Health
- `app/diet-plan/page.tsx` - AI-generated personalized diet plans
- `app/make-healthy/page.tsx` - Generate healthier alternatives
- `app/make-healthy-results/page.tsx` - Display healthy alternatives
- `app/sustainable-meal/page.tsx` - Generate sustainable meals
- `app/sustainable-results/page.tsx` - Display sustainable results
- `app/calorie-test/page.tsx` - Calorie tracking test page

#### Shopping & Browsing
- `app/browse-restaurants/page.tsx` - Browse available restaurants
- `app/restaurant-menu/page.tsx` - View restaurant menus
- `app/view-restaurant-menu/page.tsx` - Detailed restaurant menu
- `app/browse-deals/page.tsx` - Browse restaurant deals
- `app/view-deals/page.tsx` - View and manage deals
- `app/view-restaurant-deals/page.tsx` - Restaurant-specific deals
- `app/all-foods/page.tsx` - Browse all available foods

#### Orders & Shopping
- `app/my-orders/page.tsx` - User order history
- `app/grocery/page.tsx` - Grocery list management

#### Testing
- `app/camera-test/page.tsx` - Camera/image recognition test

### Restaurant Pages

#### Authentication & Dashboard
- `app/restaurent/page.tsx` - Restaurant login page
- `app/restaurent-dashboard/page.tsx` - Restaurant management dashboard

#### Menu & Food Management
- `app/add-food/page.tsx` - Add new food items
- `app/restaurant-menu/page.tsx` - Manage restaurant menu

#### Orders & Deals
- `app/restaurant-orders/page.tsx` - Restaurant order management
- `app/ai-deal-maker/page.tsx` - AI-powered deal creation

### Root Pages
- `app/page.tsx` - Home page
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles

---

## API Routes Directory (`app/api/`)

### Authentication & User Management
- `app/api/user-auth/login/route.ts` - User login endpoint
- `app/api/user-auth/signup/route.ts` - User registration endpoint
- `app/api/user-auth/face-login/route.ts` - Face recognition login
- `app/api/auth/login/route.ts` - Restaurant login endpoint
- `app/api/user-profile/route.ts` - GET/PUT user profile
- `app/api/user-profile-update/route.ts` - PUT update profile
- `app/api/user-allergies/route.ts` - GET/PUT user allergies

### Food & Menu Management
- `app/api/all-foods/route.ts` - GET all available foods
- `app/api/search-food/route.ts` - POST search for foods
- `app/api/create-food/route.ts` - POST create new food
- `app/api/delete-food/route.ts` - DELETE food item
- `app/api/toggle-food-status/route.ts` - PUT toggle food active/inactive
- `app/api/restaurant-foods/route.ts` - GET foods for restaurant
- `app/api/restaurant-menu/route.ts` - GET restaurant menu
- `app/api/public-restaurant-menu/route.ts` - GET public menu
- `app/api/generate-dish-data/route.ts` - POST generate dish data (Qwen)

### Deals Management
- `app/api/generate-deals/route.ts` - POST generate deals (Qwen)
- `app/api/public-deals/route.ts` - GET public deals
- `app/api/restaurant-deals/route.ts` - GET restaurant deals
- `app/api/restaurant-specific-deals/route.ts` - GET specific restaurant deals
- `app/api/activate-deal/route.ts` - POST activate deal
- `app/api/toggle-deal-status/route.ts` - PUT toggle deal status
- `app/api/update-deal-price/route.ts` - PUT update deal price
- `app/api/update-deal-item-quantity/route.ts` - PUT update deal item quantity

### Cart & Orders
- `app/api/cart/route.ts` - GET/POST/DELETE cart operations
- `app/api/cart/items/route.ts` - GET/POST/PUT/DELETE cart items
- `app/api/orders/create/route.ts` - POST create order
- `app/api/orders/details/route.ts` - GET order details
- `app/api/orders/user/route.ts` - GET user orders
- `app/api/orders/restaurant/route.ts` - GET restaurant orders
- `app/api/orders/update-status/route.ts` - PUT update order status

### Calorie & Health Tracking
- `app/api/user-calory/route.ts` - GET/PUT user calorie data
- `app/api/calorie-tracker/route.ts` - GET/POST calorie tracking
- `app/api/calorie-tracker/log/route.ts` - GET calorie log
- `app/api/check-meal-allergies/route.ts` - POST check meal allergies (Qwen)
- `app/api/verify-halal/route.ts` - POST verify halal status (Qwen)
- `app/api/health-food-recommendations/route.ts` - GET health recommendations

### AI Features
- `app/api/generate-diet-plan/route.ts` - POST generate diet plan (Qwen)
- `app/api/generate-healthy-dish/route.ts` - POST generate healthy dish (Qwen)
- `app/api/generate-sustainable-dish/route.ts` - POST generate sustainable dish (Qwen)

### Grocery & Budget
- `app/api/grocery/route.ts` - GET/POST grocery operations
- `app/api/grocery/items/route.ts` - GET/POST/PUT/DELETE grocery items
- `app/api/grocery/clear-purchased/route.ts` - DELETE clear purchased items
- `app/api/budget/fetch-prices/route.ts` - POST fetch ingredient prices (Qwen)
- `app/api/budget/generate-pdf/route.ts` - POST generate budget PDF

### Restaurant Management
- `app/api/restaurants/list/route.ts` - GET all restaurants
- `app/api/public-restaurants/route.ts` - GET public restaurants
- `app/api/restaurant-profile/route.ts` - GET/PUT restaurant profile
- `app/api/restaurant-profile/upload/route.ts` - POST upload profile image
- `app/api/restaurant-ingredients/route.ts` - GET/POST restaurant ingredients

### Utilities
- `app/api/upload-image/route.ts` - POST upload image
- `app/api/user-favourites/route.ts` - GET/POST user favorites

---

## Utility Files (`lib/`)

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client initialization |
| `ai-strategies.ts` | AI strategy implementations |
| `auth/jwt-auth.ts` | JWT authentication helpers |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `next.config.ts` | Next.js configuration |

---

## Database Tables

### User Management
- `users` - User profiles (id, username, email, password, profile_image, age, weight, profession, allergies)
- `restaurant_user` - Restaurant accounts (id, email, password, name, registration_number, profile_pic)

### Food & Menu
- `food` - Food items (id, restaurant_id, name, description, price, allergies, image_url, total_calories, is_active)
- `food_details` - Food ingredients (id, food_id, ingredient_name, calories_count)

### Deals
- `deals` - Restaurant deals (id, restaurant_id, deal_name, description, deal_price, total_calories, is_active)
- `deal_items` - Items in deals (id, deal_id, food_id, quantity)

### Shopping & Orders
- `shopping_carts` - User shopping carts (id, user_id, restaurant_id, created_at, updated_at)
- `cart_items` - Items in carts (id, cart_id, food_id, deal_id, item_type, quantity, unit_price)
- `orders` - User orders (id, user_id, restaurant_id, total_amount, status, delivery_address, phone_number, special_instructions)
- `order_items` - Items in orders (id, order_id, food_id, deal_id, item_type, quantity, unit_price, total_price)

### Health & Tracking
- `user_calory` - Calorie tracking (id, user_id, current_calory, limit_calory, breakfast, lunch, dinner)
- `calorie_log` - Calorie history (id, user_id, food_name, calories, source_type, source_id, order_id, logged_at, date)

### Grocery & Budget
- `grocery_lists` - User grocery lists (id, user_id, name, created_at, updated_at)
- `grocery_items` - Items in grocery lists (id, grocery_list_id, ingredient_name, quantity, unit, is_purchased, source_food_id, source_food_name, is_custom, estimated_price, price_fetched_at)

### Caching
- `halal_verification_cache` - Halal verification results (id, deal_id, is_halal, ingredients, verified_at, expires_at)

---

## Environment Variables (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://eayehrircqhylgfdkyzu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_uKnL6J6H5KYB6ftgimW03g_9DFi3cVp
Supabase Secret Key: <your-supabase-secret-key>
# OpenRouter API (Qwen AI)
OpenRouter API Key: <your-openrouter-api-key>


# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
```

---

## Dependencies (from `package.json`)

### Core
- `next@16.2.3` - React framework
- `react@19.2.4` - UI library
- `react-dom@19.2.4` - React DOM
- `typescript@^5` - Type safety

### Database & Auth
- `@supabase/supabase-js@^2.103.0` - Supabase client
- `jsonwebtoken@^9.0.3` - JWT tokens
- `@types/jsonwebtoken@^9.0.10` - JWT types

### AI & APIs
- `@openrouter/sdk@^0.11.2` - OpenRouter API client

### UI & Styling
- `tailwindcss@^4` - CSS framework
- `@tailwindcss/postcss@^4` - Tailwind PostCSS
- `framer-motion@^12.38.0` - Animations
- `react-icons@^5.6.0` - Icon library

### Utilities
- `jspdf@^4.2.1` - PDF generation
- `face-api.js@^0.22.2` - Face recognition

---

## Quick Navigation Guide

### To Find Calorie Tracking Code
- Service: `lib/services/calorie-calculator.ts`
- UI: `components/SimpleCalorieCounter.tsx`
- API: `app/api/user-calory/route.ts`
- Page: `app/diet-plan/page.tsx`

### To Find Allergy Management Code
- Service: `lib/services/allergies-service.ts`
- UI: `components/AllergiesSelector.tsx`
- API: `app/api/user-allergies/route.ts`
- Checker: `components/MealAllergyChecker.tsx`

### To Find Halal Verification Code
- Service: `lib/services/halal-verifier.ts`
- Badge: `components/HalalBadge.tsx`
- API: `app/api/verify-halal/route.ts`

### To Find Cart Management Code
- Service: `lib/services/cart-service.ts`
- UI: `components/OrderCart.tsx`
- API: `app/api/cart/route.ts`

### To Find Order Management Code
- Service: `lib/services/order-service.ts`
- API: `app/api/orders/create/route.ts`
- Page: `app/my-orders/page.tsx`

### To Find Food Management Code
- Service: `lib/services/menu-item-service.ts`
- Repository: `lib/repositories/menu-item-repository.ts`
- API: `app/api/create-food/route.ts`
- Page: `app/add-food/page.tsx`

### To Find Grocery Management Code
- Service: `lib/services/grocery-service.ts`
- API: `app/api/grocery/route.ts`
- Page: `app/grocery/page.tsx`

### To Find Budget Planning Code
- Service: `lib/services/budget-planning-service.ts`
- API: `app/api/budget/fetch-prices/route.ts`
- Command: `lib/commands/pdf-generator-command.ts`

---

## File Count Summary

- **Services**: 11 files
- **Repositories**: 2 files
- **Commands**: 4 files
- **Components**: 20+ files
- **Pages**: 25+ files
- **API Routes**: 40+ files
- **Utilities**: 3 files
- **Configuration**: 5 files

**Total**: 100+ files implementing 12 features with 9 design patterns
