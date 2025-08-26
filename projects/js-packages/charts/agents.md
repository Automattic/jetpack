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

## Development Workflow

### For New Components
1. **Check existing components** - Determine if functionality can be added to existing components rather than creating new ones
2. **Use the template** - Start with `docs/feature-documentation.mdx.template`
3. **Follow compound patterns** - Study existing chart components for composition patterns
4. **Integrate with providers** - Ensure compatibility with existing context providers

### For Component Modifications
1. **Study surrounding code** - Understand existing patterns and conventions
2. **Maintain backward compatibility** - Avoid breaking changes to public APIs
3. **Update documentation** - Follow the ai-documentation-guide.md standards
4. **Test thoroughly** - Verify existing functionality remains intact

### For New Chart Types
1. **Use visx primitives** - Build on established @visx/xychart patterns
2. **Follow theme system** - Integrate with existing color and styling systems
3. **Consider animations** - Use @react-spring/web patterns for smooth transitions
4. **Accessibility review** - Ensure screen reader compatibility and keyboard navigation

## Build System

- **Rollup** for production builds (CJS/ESM/Types)
- **Webpack** for alternative build pipeline
- **Multiple export patterns** in package.json:
  - `./` - Main library entry
  - `./*` - Individual components
  - `./providers/*` - Context providers
  - `./visx/*` - visx-related utilities

## Security & Compliance

- GPL-2.0-or-later license
- No secrets or sensitive data in components
- WordPress security standards where applicable
- Report security issues via [automattic.com/security](https://automattic.com/security)