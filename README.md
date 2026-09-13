# Matthew W. Jun

A React application built with Vite, TypeScript, and shadcn/ui.

The homepage follows a scroll-driven story: a braided orbital form transforms into a helix and a spherical network, followed by capabilities and contact information. Scroll position controls the geometry, camera, and final sphere rotation; the canvas renders on demand and stops when scrolling settles, motion is paused, or the scene is offscreen. Visitors can pause the scene, and system reduced-motion preferences select a static, more compact layout.

### Editing the portfolio

- `src/components/HeroSection.tsx` contains the three story chapters and scene controls.
- `src/components/ScrollSculpture.tsx` renders the scroll sequence without downloaded frame assets or WebGL dependencies.
- `src/components/PortfolioStory.tsx` contains selected work, capabilities, and contact links.
- `src/styles/portfolio.css` controls the homepage layout and responsive styling.
- The existing About, Projects, Skills, and Contact pages remain directly accessible and load on demand.
- `AboutSection.tsx` contains the career history; `HelixTimeline3D.tsx` and `JourneyHelix.tsx` present it as a reversible, scroll-driven descent. Reduced motion uses a compact static timeline.
- `ExperienceLogos.tsx` displays a pausable strip of official company logos. Original assets and source URLs are kept in `public/brands/`.

The production build also emits `dist/404.html` so GitHub Pages can render direct visits to client-side routes. The existing GitHub Actions workflow builds and publishes on pushes to `main`.

### Previous versions

The Projects page links to V1 at `https://matthew-w-jun.vercel.app/` and V2 at `/versions/v2/index.html`. The homepage is the current V3. V2 is a frozen build in `public/versions/v2`, recovered from commit `18647fd45b55299eea07405bad9419c289777213`. Its only archive adaptations are hash-based routing, a `/versions/v2/` asset base, an archive document title, and a return link. Keep this folder when updating the current site; normal builds copy it into the deployment automatically. V1 continues to use its existing hosted site; V2 needs no separate Vercel deployment.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **Framer Motion** - Animations

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd matthew-w-jun

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

## Project Structure

```
src/
├── components/   # Reusable UI components
├── lib/          # Utilities and config
├── pages/        # Route components
└── ...
```
