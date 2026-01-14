---
applyTo: "projects/js-packages/**/*.{js,jsx,ts,tsx}"
---

# JavaScript Packages Instructions

## Package Structure

JavaScript packages in `projects/js-packages/` are npm packages with the naming convention `@automattic/jetpack-{name}`.

## Key Files

- `package.json` - Package metadata, dependencies, and scripts
- `src/` - Source TypeScript/JavaScript files
- `test/` or `tests/` - Jest test files
- `CHANGELOG.md` - Generated from changelog entries
- `changelog/` - Changelog entry files
- `tsconfig.json` - TypeScript configuration (if TypeScript)
- `jest.config.js` - Jest configuration (if tests exist)

## Build Configuration

- Use shared webpack config from `projects/js-packages/webpack-config`
- Use Babel for transpilation, not ts-loader for TypeScript
- Must support `jetpack:src` exports in package.json for ESLint to work without building
- Avoid `.scripts.prepare` for compilation on install

## TypeScript

- Prefer TypeScript over JavaScript for new code
- Use strict mode in tsconfig.json
- Export types for public APIs
- Use `@babel/preset-typescript` for compilation

## Testing

- Use Jest with `@testing-library/react` for React components
- Use `@testing-library/react-hooks` for custom hooks
- Test files should be co-located or in `test/` directory
- Run tests: `pnpm test` or `jetpack test`
- Aim for high coverage of public APIs

## Code Style

- Use ESLint with monorepo config (inherited automatically)
- Use Prettier for formatting (configured at monorepo root)
- Follow functional/declarative patterns for React
- Use hooks over class components
- Prefer named exports over default exports

## Translations (i18n)

- Use `@wordpress/i18n` package for all translatable strings
- Import with: `import { __ } from '@wordpress/i18n';`
- Use appropriate text domain (same as package name)
- Use `@automattic/babel-plugin-replace-textdomain` for bundling

## Dependencies

- Prefer existing monorepo js-packages over external dependencies
- Check if dependency exists elsewhere in monorepo first
- Match versions with other uses when possible
- Avoid large dependencies that increase bundle size
- Use peer dependencies for React and similar packages

## React Patterns

- Use functional components with hooks
- Use TypeScript for prop types
- Destructure props for clarity
- Use `useMemo` and `useCallback` appropriately for performance
- Keep components small and focused

## Browser Compatibility

- Follow Gutenberg's browser support via `browserslist-config`
- Babel handles compatibility, don't manually polyfill
- Test in modern browsers (Chrome, Firefox, Safari, Edge)
