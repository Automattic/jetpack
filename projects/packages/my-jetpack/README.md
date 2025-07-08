# My Jetpack

WP Admin page with information and configuration shared among all Jetpack stand-alone plugins

## Overview

My Jetpack is a centralized WordPress admin page that provides a unified interface for managing all Jetpack products and services. It serves as the main dashboard where users can view, install, configure, and manage their Jetpack products.

## Usage

Every Jetpack plugin must include the My Jetpack package.

Require this package and initialize it:

```PHP
add_action( 'init', function() {
 Automattic\Jetpack\My_Jetpack\Initializer::init();
} );
```

### Conditionally loading licensing UI behind a feature flag

To disable the licensing UI at `/wp-admin/admin.php?page=my-jetpack#/add-license`, add a filter on `jetpack_my_jetpack_should_enable_add_license_screen` and return false: `add_filter( 'jetpack_my_jetpack_should_enable_add_license_screen', '__return_false' );`

## Architecture

### Core Components

#### PHP Backend (`src/`)

- **Initializer** (`class-initializer.php`): Main entry point that sets up admin menu, REST endpoints, and asset enqueuing
- **Products** (`class-products.php`): Core product management system with status constants and lifecycle handling
- **Product Classes** (`src/products/`): Individual product implementations inheriting from base `Product` class
- **REST API** (`class-rest-*.php`): API endpoints for product management, purchases, and AI functionality

#### React Frontend (`_inc/`)

- **Main App** (`admin.jsx`): Entry point with React Router setup
- **Components** (`components/`): Reusable UI components for product cards, screens, and interstitials
- **Data Layer** (`data/`): Custom hooks and API integration using React Query (see [Data Layer Documentation](./_inc/data/README.md))
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

## Development

### Commands

**Build Commands:**

- `jetpack build packages/my-jetpack` - Build from monorepo root
- `jetpack watch packages/my-jetpack` - Watch mode from monorepo root
- `pnpm run build` - Build from package directory
- `pnpm run test` - Run tests from package directory

### Testing Strategy

**Testing:**

- **PHP**: PHPUnit with WordPress test environment and polyfills
- **JavaScript**: Jest with React Testing Library
- **E2E**: Integration with monorepo Playwright setup

### Development Notes

**Code Standards:**

- Uses WordPress coding standards and Jetpack extensions
- Requires WordPress.com connection for full functionality
- Integrates with Jetpack licensing and purchase systems
- Supports feature flags for gradual rollouts
- Compatible with WordPress multisite (when enabled)

## API Endpoints

### REST API Patterns

- **Base namespace**: `jetpack/v4/my-jetpack`
- **Products endpoint**: `/products` - main product data and actions
- **Purchases endpoint**: `/purchases` - user purchase information
- **Feature endpoints**: Various feature-specific endpoints

### Data Flow

1. React components call API via `apiFetch`
2. WordPress routes to appropriate REST controller
3. Controller validates permissions and processes request
4. Product classes handle business logic
5. Response returned to frontend for UI updates

## Key Files Reference

### PHP Files

- `src/class-initializer.php` - Main initialization, admin menu setup
- `src/class-products.php` - Core product management, status constants
- `src/products/class-product.php` - Base product class
- `src/class-rest-products.php` - Main products API endpoint
- `src/class-wpcom-products.php` - WordPress.com product integration

### React Files

- `_inc/admin.jsx` - Main React application entry point
- `_inc/providers.tsx` - Context providers wrapper
- `_inc/constants.ts` - Route definitions and constants
- `_inc/components/my-jetpack-screen/` - Main dashboard screen
- `_inc/components/product-interstitial/` - Product setup flows
- `_inc/data/` - API hooks and data management using React Query

### Configuration Files

- `package.json` - Dependencies and scripts
- `webpack.config.js` - Build configuration
- `babel.config.js` - JavaScript transpilation
- `tsconfig.json` - TypeScript configuration

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
