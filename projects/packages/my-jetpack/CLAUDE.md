# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Build and watch
pnpm run build                 # Build the React app
pnpm run watch                 # Watch for changes and rebuild
pnpm run clean                 # Clean build directory

# Testing
pnpm run test                  # Run Jest tests
pnpm run test-coverage         # Run tests with coverage
pnpm run typecheck             # TypeScript type checking
composer phpunit               # Run PHP unit tests

# Linting and formatting
jetpack lint                   # JavaScript linting
jetpack reformat-files         # Prettier formatting
composer phpcs:lint            # PHP CodeSniffer
composer phpcs:fix             # Auto-fix PHP issues

# Monorepo commands (from project root)
jetpack build packages/my-jetpack  # Build with dependencies
jetpack test js packages/my-jetpack # Run JS tests
jetpack test php packages/my-jetpack # Run PHP tests
```

## Architecture

### Overview
My Jetpack is a centralized WordPress admin page that provides a unified interface for managing all Jetpack products and services. It serves as the main dashboard where users can view, install, configure, and manage their Jetpack products.

### Core Components

#### PHP Backend (`src/`)
- **Initializer** (`class-initializer.php`): Main entry point that sets up admin menu, REST endpoints, and asset enqueuing
- **Products** (`class-products.php`): Core product management system with status constants and lifecycle handling
- **Product Classes** (`src/products/`): Individual product implementations inheriting from base `Product` class
- **REST API** (`class-rest-*.php`): API endpoints for product management, purchases, and AI functionality

#### React Frontend (`_inc/`)
- **Main App** (`admin.jsx`): Entry point with React Router setup
- **Components** (`components/`): Reusable UI components for product cards, screens, and interstitials
- **Data Layer** (`data/`): Custom hooks and API integration using React Query
- **Context** (`context/`): Global state management for notices and values

### Product System
- Products inherit from base `Product` class with standardized interface
- Status constants define product lifecycle: `active`, `inactive`, `needs_plan`, `plugin_absent`, etc.
- Hybrid products can function as both standalone plugins and Jetpack modules
- Product cards dynamically display status, actions, and pricing information

### Key Features
- **Connection Management**: Handles WordPress.com site and user connections
- **Product Interstitials**: Purchase/activation flows for each product
- **Onboarding Flow**: Guided setup for new users
- **Licensing**: License key management and validation
- **Activity Log**: Integration with Jetpack activity monitoring
- **Speed Score**: Boost performance metrics integration

### Frontend Architecture
- React 18 with functional components and hooks
- React Router for client-side navigation
- CSS Modules for component styling
- TypeScript for type safety
- Custom data hooks using React Query for API state management

### Build System
- Webpack with Jetpack-specific configuration
- Babel for JavaScript transpilation
- Sass for CSS preprocessing
- Asset optimization for production builds
- Textdomain replacement for internationalization

### Testing Strategy
- **PHP**: PHPUnit with WordPress test environment and polyfills
- **JavaScript**: Jest with React Testing Library
- **E2E**: Integration with monorepo Playwright setup
- Mock classes and fixtures for isolated testing

### Development Notes
- Uses WordPress coding standards and Jetpack extensions
- Requires WordPress.com connection for full functionality
- Integrates with Jetpack licensing and purchase systems
- Supports feature flags for gradual rollouts
- Compatible with WordPress multisite (when enabled)