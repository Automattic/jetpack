# AGENTS.md

This file provides AI coding agents with specific instructions and context for working on the @automattic/charts library.

## Project Overview

**@automattic/charts** is a React/TypeScript charting library built for interactive data visualizations within Automattic products. The library is built on visx and emphasizes accessibility, responsiveness, and developer experience through a component composition API.

**Key Technologies:**

- React 18+ with TypeScript (strict mode)
- visx for chart primitives
- PostCSS/Sass with BEM naming convention
- Jest + Testing Library for testing
- Storybook for documentation and development

## Essential Commands

```bash
# Development
pnpm run build              # Build the package
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

- **[docs/ai-documentation-guide.md](docs/ai-documentation-guide.md)** - Comprehensive guide covering documentation standards, writing patterns, and quality requirements for chart components
- **[docs/feature-documentation.mdx.template](docs/feature-documentation.mdx.template)** - Standard MDX template for new component documentation
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
2. **Maintain backward compatibility** - Breaking changes to public APIs only when necessary
3. **Update documentation** - Follow the ai-documentation-guide.md standards
4. **Test thoroughly** - Verify existing functionality remains intact

### For New Chart Types

1. **Use visx primitives** - Build on established visx patterns
2. **Follow theme system** - Integrate with existing color and styling systems
3. **Accessibility review** - Ensure screen reader compatibility and keyboard navigation

## Build System

- **Rollup** for production builds (CJS/ESM/Types)
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

## Pull Request Guidelines

When contributing to the Charts library, follow the Jetpack monorepo's standard PR process:

### Required Elements

- **PR Title**: Use format "Charts: [clear description of change]"
- **Changelog Entry**: Run `pnpm changelog add` in the charts directory
- **Testing Instructions**: Include specific steps for testing chart components
- **Visual Changes**: Provide screenshots/GIFs for any UI modifications

### Charts-Specific Considerations

- **Storybook Links**: Include links to new/modified component stories
- **Accessibility Notes**: Document accessibility features and testing approach
- **Performance Impact**: Note any considerations for large datasets or complex visualizations
- **Browser Compatibility**: Highlight any browser-specific concerns
- **Theme Integration**: Verify changes work across different theme configurations

### Reference Documentation

- [Jetpack Contributing Guide](../../../../docs/CONTRIBUTING.md) - Main contribution standards
- [PR Lifecycle Documentation](../../../../docs/pull-request.md) - Detailed PR process
- [Changelog Guidelines](../../../../docs/writing-a-good-changelog-entry.md) - Required changelog format

**Note**: All PRs automatically use the monorepo-wide PR template from `.github/PULL_REQUEST_TEMPLATE.md`.

## Agent-Specific Guidelines

### Charts Skills

- For chart documentation workflows, use `.agents/skills/charts-docs.md`.

### Before Making Changes

- Read existing component documentation and stories
- Check Storybook for usage patterns and examples
- Verify TypeScript types compile without errors
- Run tests to ensure no regressions

### When Adding Features

- Prefer extending existing components over creating new ones
- Use established theme and provider patterns
- Follow the documentation template for new features
- Consider performance impact on large datasets

### Quality Checklist

- [ ] TypeScript compiles without errors (`pnpm run typecheck`)
- [ ] Tests pass (`pnpm run test`)
- [ ] Documentation follows ai-documentation-guide.md standards
- [ ] Component works with existing providers and themes
- [ ] Accessibility requirements met
- [ ] Storybook stories updated/created

## Getting Help

- **Documentation**: Start with `docs/ai-documentation-guide.md`
- **Examples**: Review existing chart components and their stories
- **Build Issues**: Check package.json scripts and build configurations
- **Testing**: Follow patterns in existing test files

This library prioritizes maintainability, accessibility, and developer experience. Always consider how changes affect the broader ecosystem and existing users.
