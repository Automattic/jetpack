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

## Documentation Standards

**IMPORTANT:** This project has comprehensive documentation standards. Before creating or modifying any components, agents must reference:

- **[docs/ai-documentation-guide.md](docs/ai-documentation-guide.md)** - 354-line comprehensive guide defining 11 standard sections for chart documentation, writing patterns, and quality standards
- **[docs/feature-documentation.mdx.template](docs/feature-documentation.mdx.template)** - Standard MDX template with bracket placeholders for new component documentation
- **[Storybook Documentation](https://automattic.github.io/jetpack-storybook/?path=/docs/js-packages-charts)** - Live examples and API references

## Code Standards & Architecture

### Component Architecture
- **Compound Components**: Follow established patterns where parent components provide context and child components handle specific functionality
- **Theme System**: Use the centralized theme system for colors, spacing, and styling
- **Accessibility First**: Ensure WCAG 2.1 AA compliance for all chart components

### TypeScript Standards
- Strict TypeScript mode enabled
- Export types for all public APIs
- Use proper generic constraints for data types
- Define clear prop interfaces with JSDoc comments

### Styling Standards
- **BEM CSS naming convention** (per global guidelines)
- PostCSS with Sass support
- CSS custom properties for theming
- **Never use `!important`** (per global guidelines)
- Responsive design patterns

### Testing Requirements
- Jest configuration: `tests/jest.config.cjs`
- UTC timezone for consistent test results
- @testing-library/react for component testing
- Test both interaction and visual rendering
- Maintain existing coverage standards