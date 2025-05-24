# NEAR Governance Proposal Generator

This application allows users to create comprehensive governance proposals for the NEAR protocol. Users enter an idea, and the system generates a complete proposal with all necessary sections, which can then be edited and refined.

## Features

- Generate a complete governance proposal from a simple idea
- Edit each section of the proposal with a user-friendly interface
- Lock/unlock sections as you complete them
- Regenerate individual sections as needed
- Submit the final proposal when ready

## Technology Stack

- ReactJS (with TypeScript) g
- Vite for fast development and building
- PNPM for efficient package management
- Chakra UI for the user interface
- Zustand for state management
- React Hook Form for form handling
- Langflow API integration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PNPM
- A Langflow API key

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd governance-app
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the project root and add your Langflow API key:
   ```
   VITE_LANGFLOW_API_KEY=your_api_key_here
   ```

4. Start the development server
   ```bash
   pnpm dev
   ```

## Development

### Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm preview` - Preview the production build locally
- `pnpm lint` - Run ESLint to check for code issues

### Project Structure

```
src/
├── components/        # UI components
├── hooks/             # Custom React hooks
├── pages/             # Page components
├── services/          # API services
├── store/             # Zustand store
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## Deployment

Build the application for production:

```bash
pnpm build
```

The build output will be in the `dist` directory, which can be deployed to any static hosting service.

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
