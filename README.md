<div align="center">

# 🍽️ PlatePilot

### AI-Powered Full-Stack Food Delivery & Nutrition Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

> A production-grade full-stack web application combining restaurant management, food delivery, AI-powered meal recommendations, real-time nutrition tracking, and sustainable dining — all in one platform.

</div>

---

## 📌 Short Description

**PlatePilot** is a full-stack food delivery and restaurant management platform built with **Next.js 16**, **React 19**, **TypeScript**, and **Supabase (PostgreSQL)**. It integrates **Qwen 2.5 72B** (via OpenRouter) to power AI features including personalized diet plans, halal food verification, AI-generated restaurant deals, and allergen detection. The codebase demonstrates real-world application of **9 software design patterns** across a clean layered architecture (UI → Services → Repositories → Database).

---

## ✨ Key Features

| Feature | Description | Tech Highlights |
|---|---|---|
| 🤖 **AI Diet Plans** | Generates personalized meal plans based on user profile, weight, and current intake | Qwen 2.5 72B LLM |
| 🕌 **Halal Verification** | AI verifies ingredient-level halal status with 24-hour caching | Decorator Pattern + LLM |
| 🚨 **Allergy Checker** | Scans 35+ allergens against user profile before adding to cart | AI-powered matching |
| 📊 **Calorie Tracker** | Real-time per-meal calorie tracking with daily limit alerts | Strategy + Observer Pattern |
| 🛒 **Smart Cart** | Unified cart for food items and deals, grouped by restaurant | Composite + Command Pattern |
| 📦 **Order Management** | Full order lifecycle from cart to real-time status updates | Observer + Command Pattern |
| 🥗 **Healthy Meal Generator** | AI suggests healthier or sustainable alternatives for any dish | LLM + Strategy Pattern |
| 💸 **Budget & Grocery Planner** | AI-estimated grocery prices, budget breakdowns, PDF export | jsPDF + LLM Integration |
| 🤝 **AI Deal Maker** | Restaurants create AI-generated promotional deals | LLM + Command Pattern |
| 🔐 **JWT Authentication** | Separate auth flows for users and restaurants | JWT + Repository Pattern |

---

## 🏗️ Architecture

PlatePilot follows a clean **4-layer architecture** enforcing separation of concerns:

```
┌───────────────────────────────────────┐
│        UI Layer (React / Next.js)     │  Pages, Components, Screens
└──────────────────┬────────────────────┘
                   │
┌──────────────────▼────────────────────┐
│          Services Layer               │  Business Logic & Design Patterns
│  CalorieCalculatorService             │
│  HalalVerifierService                 │
│  CartService · OrderService           │
│  GroceryService · BudgetPlanningService│
└──────────────────┬────────────────────┘
                   │
┌──────────────────▼────────────────────┐
│         Repository Layer              │  Supabase Data Access Abstraction
│  SupabaseCalorieRepository            │
│  SupabaseOrderRepository              │
│  SupabaseHalalRepository · ...        │
└──────────────────┬────────────────────┘
                   │
┌──────────────────▼────────────────────┐
│           Data Layer                  │  Supabase PostgreSQL
│  users · food · deals · orders        │
│  user_calory · grocery_items          │
│  shopping_carts · halal_verification  │
└───────────────────────────────────────┘
```

---

## 🧩 Design Patterns Implemented

This project demonstrates **9 GoF/enterprise design patterns** — a key showcase of software engineering depth:

| Pattern | Where Used |
|---|---|
| **Factory (Singleton)** | All service layers — guarantees single repository instances |
| **Strategy** | Calorie calculation, food display, ingredient extraction, budget |
| **Repository** | All Supabase data access — decouples business logic from DB queries |
| **Observer** | Real-time updates for profile, allergies, halal status, orders, calories |
| **Command** | Cart operations, order creation, PDF generation, deal creation |
| **Composite** | Cart treats food items and deals through a unified interface |
| **Decorator** | `HalalBadge` dynamically decorates any food or deal component |
| **Unit of Work** | `MenuItemService` coordinates multiple repositories atomically |
| **Singleton** | Enforced via Factory — one instance per service across the app |

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.2.3** — App Router, Server & Client Components, API Routes
- **React 19.2.4** — Latest concurrent features
- **TypeScript 5** — End-to-end type safety
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Smooth UI animations

### Backend
- **Next.js API Routes** — Serverless REST API endpoints (~20+ routes)
- **Node.js** — Runtime for server-side logic
- **JWT (jsonwebtoken)** — Stateless authentication

### Database & Auth
- **Supabase** — PostgreSQL database with real-time support
- **Supabase JS SDK** — Type-safe database client
- **Row Level Security** — Database-level access control

### AI / ML
- **OpenRouter API** — AI model gateway
- **Qwen 2.5 72B Instruct** — Powers diet plans, halal checks, deal generation, allergen detection

### Utilities
- **jsPDF** — Client-side PDF generation for budget reports
- **face-api.js** — Image recognition support
- **React Icons** — Consistent icon library

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/food-app.git
cd food-app

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your Supabase URL, Supabase anon key, OpenRouter API key, and JWT secret

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
food-app/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/                    # 20+ serverless REST endpoints
│   ├── diet-plan/              # AI diet plan page
│   ├── ai-deal-maker/          # AI deal generation page
│   ├── grocery/                # Grocery & budget planner
│   ├── make-healthy/           # Healthy meal generator
│   ├── sustainable-meal/       # Sustainable meal generator
│   ├── my-orders/              # User order history
│   └── restaurant-orders/      # Restaurant order management
├── components/                 # Reusable React components
│   ├── HalalBadge.tsx          # Decorator pattern implementation
│   ├── SimpleCalorieCounter.tsx
│   ├── MealAllergyChecker.tsx
│   ├── OrderCart.tsx
│   └── ...
├── lib/
│   ├── services/               # Business logic (Strategy, Observer, Factory)
│   ├── repositories/           # Data access layer (Repository Pattern)
│   ├── commands/               # Command pattern implementations
│   └── auth/                   # JWT authentication helpers
├── src/screens/                # Page-level screen components
└── styles/                     # Global styles
```

---

🔗 **Live Demo:** [platepilot-mavraiqbal.vercel.app](https://platepilot-mavraiqbal.vercel.app/)

