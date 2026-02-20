# SiteCoHub: The Art of Digital Color

Decode the aesthetic DNA of the world's most successful websites. SiteCoHub is a platform that allows you to analyze usage percentages, track historical changes, and spot emerging trends in website color palettes from top companies.

## Features

- **Deep Analysis**: Break down brand palettes into precise usage percentages and roles (Apperance, Text Colors, Backgrounds).
- **Live Tracking**: Monitor cosmetic updates and keep track of the version history of website designs. Includes a built-in script to automatically check and update site palettes.
- **Trend Insights**: Visualize dominant colors and aesthetic shifts across the industry using interactive charts.
- **Interactive Showcase**: Explore a curated list of top companies' UI colors and design choices with slick animations.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion (Animations)
- **Routing**: React Router DOM v7
- **Icons & Visualization**: Lucide React, Recharts
- **Data Scraping**: Puppeteer, Cheerio (for updating color palettes automatically)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd sitecohub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: `http://localhost:5173`

### Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run update-palettes`: Executes the backend scraping script (`scripts/update_palettes.js`) utilizing Puppeteer and Cheerio to refresh the site palette data.
