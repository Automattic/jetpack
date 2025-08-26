# AGENTS.md

This file provides AI coding agents with specific instructions and context for working on the @automattic/charts library.

## Project Overview

**@automattic/charts** is a React/TypeScript charting library built for interactive data visualizations within Automattic products. The library is built on top of `@visx/xychart` and emphasizes accessibility, responsiveness, and developer experience through a component composition API.

**Key Technologies:**
- React 18+ with TypeScript (strict mode)
- @visx/xychart for chart primitives
- @react-spring/web for animations
- PostCSS/Sass with BEM naming convention
- Jest + Testing Library for testing
- Storybook for documentation and development

## Essential Commands

```bash
# Development
pnpm run build:dev          # Development build with source maps
pnpm run storybook          # Start Storybook development server
pnpm run typecheck          # TypeScript type checking

# Testing & Quality
pnpm run test               # Run Jest test suite (TZ=UTC)
pnpm run test-coverage      # Run tests with coverage report

# Production
pnpm run build:prod         # Production build (clean + optimized)
```