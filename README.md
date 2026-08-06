# BUNA — Premium Ethiopian Coffee Experience ☕🇪🇹

BUNA is a full-stack web application celebrating Ethiopian coffee heritage, sensory discovery, and interactive gamification.

## Overview
BUNA brings authentic Ethiopian coffee culture—from the ancient highland regions of Yirgacheffe, Sidama, Guji, and Harrar to traditional Jebena brewing ceremonies—into a modern digital experience with real-time order customizers, passport stamping, raffle rewards, and owner analytics.

## Features
- **Custom Drink Builder**: Interactive visual cup builder with roast levels, Ethiopian spices (cardamom, cinnamon, ginger), milks, and real-time ETB price calculations.
- **Cart & Order Status**: Add drinks to cart, place orders, and track order status with persistent server state.
- **Interactive Origin Map & Digital Passport**: Explore regions, read authentic farmer stories, and collect digital stamps to earn loyalty points and heritage badges.
- **Aroma & Brew Guide**: Discover tasting profiles and use an interactive step-by-step brew timer for Jebena, V60, and AeroPress extractions.
- **Virtual Jebena Coffee Ceremony**: Experience the 3 traditional rounds (*Abol*, *Tona*, *Baraka*) with animated steam and sensory stories.
- **Loyalty & Gamification**: Tier progress tracking (Bronze to Master), streak counters, Lucky Bean roulette wheel, and raffle prize wheel.
- **Community Wall**: Share coffee memories, photos, and tasting notes with fellow coffee lovers.
- **Owner / Admin Dashboard**: Secure PIN-protected management for viewing revenue stats, active orders, updating menu items, managing user ranks, and customizing raffle prizes.

## Tech Stack
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Motion (Framer Motion), Lucide React, Recharts.
- **Backend**: Node.js, Express, tsx, esbuild.
- **Persistence**: JSON File Database (`data/db.json`) with persistent user profiles, orders, posts, menu items, and raffle configurations.

## Environment Variables
Create a `.env` file or pass environment variables:
```env
# Owner Admin PIN (Defaults to 2026)
ADMIN_PIN=2026
```

## Getting Started

### Installation
```bash
npm install
```

### Running in Development
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm run start
```

## Owner & Admin Access
- Click the **Owner Portal** button in the header or user drawer.
- Default Admin PIN: `2026` (configurable via `ADMIN_PIN` in `.env`).
- Server validates PIN for all protected administrative operations (`/api/owner/*`).
