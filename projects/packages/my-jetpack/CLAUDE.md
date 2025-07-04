# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash

# Build project
jetpack install packages/my-jetpack # Installs dependencies for the package
jetpack build packages/my-jetpack # Builds the project after changes

# Watch for changes
jetpack watch packages/my-jetpack # Watches the files for development. NOTE: This is a job that runs until stopped and monitors changes, should be run as a sub agent

# Testing
pnpm run test # Runs the REACT component tests. Must be ran from my-jetpack folder
pnpm run test -- <file-path> # Runs the test for a specific file.
pnpm run typecheck # TS type check

# Docker environment
jetpack docker up -d           # Start containers
jetpack docker jt-up           # Starts Jurassic Tube server for testing

# Linting and formatting
pnpm eslint                       # JavaScript linting

# Changelog management
jetpack changelog add          # Add changelog entries (required for changes)
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

## Code Patterns & Examples

### PHP Patterns

#### Product Class Structure
```php
<?php
namespace Automattic\Jetpack\My_Jetpack;

class My_New_Product extends Product {
    
    // Required static methods for product identification
    public static function get_name() {
        return 'my-new-product';
    }
    
    public static function get_title() {
        return __( 'My New Product', 'jetpack-my-jetpack' );
    }
    
    public static function get_description() {
        return __( 'Product description', 'jetpack-my-jetpack' );
    }
    
    // Core method - determines product status
    public function get_status() {
        // Use constants from Products class
        if ( ! $this->is_plugin_installed() ) {
            return self::STATUS_PLUGIN_ABSENT;
        }
        
        if ( ! $this->is_active() ) {
            return self::STATUS_INACTIVE;
        }
        
        return self::STATUS_ACTIVE;
    }
    
    // Optional: provide management URL
    public static function get_manage_url() {
        return admin_url( 'admin.php?page=my-product' );
    }
    
    // Override as needed: pricing, features, etc.
}
```

#### REST API Endpoint Pattern
```php
<?php
class REST_My_Endpoint extends WP_REST_Controller {
    
    public function __construct() {
        $this->namespace = 'jetpack/v4/my-jetpack';
        $this->rest_base = 'my-endpoint';
    }
    
    public function register_routes() {
        register_rest_route(
            $this->namespace,
            '/' . $this->rest_base,
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_items' ),
                    'permission_callback' => array( $this, 'get_items_permissions_check' ),
                ),
            )
        );
    }
    
    public function get_items_permissions_check() {
        return current_user_can( 'manage_options' );
    }
    
    public function get_items( $request ) {
        return rest_ensure_response( array( 'status' => 'success' ) );
    }
}
```

#### Product Status Constants
```php
// Status constants are defined in class-products.php
// Use Products::STATUS_* constants instead of magic strings
// Common patterns: active, inactive, needs_plan, plugin_absent, etc.
// Check class-products.php for current complete list
```

### React Patterns

#### Component Structure
```jsx
import { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useConnection } from '@automattic/jetpack-connection';
import styles from './style.module.scss';

const MyComponent = ({ productSlug, onAction }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { isRegistered, isUserConnected } = useConnection();
    
    const handleAction = async () => {
        setIsLoading(true);
        try {
            await onAction();
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={styles.container}>
            <h2>{__('My Component', 'jetpack-my-jetpack')}</h2>
            <button 
                onClick={handleAction}
                disabled={isLoading}
                className={styles.button}
            >
                {isLoading ? __('Loading...', 'jetpack-my-jetpack') : __('Action', 'jetpack-my-jetpack')}
            </button>
        </div>
    );
};

export default MyComponent;
```

#### Custom Hook Pattern
```jsx
import { useState, useEffect } from 'react';
import apiFetch from '@wordpress/api-fetch';

export const useMyJetpackData = (endpoint) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await apiFetch({
                    path: `/jetpack/v4/my-jetpack/${endpoint}`,
                });
                setData(response);
            } catch (err) {
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
    }, [endpoint]);
    
    return { data, isLoading, error };
};
```

#### Product Component Pattern
```jsx
import { useProduct } from '../hooks/use-product';

const ProductCard = ({ slug }) => {
    const { product, isLoading, error, activate, deactivate } = useProduct(slug);
    
    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    
    return (
        <div className={styles.productCard}>
            <h3>{product.title}</h3>
            <p>{product.description}</p>
            <ActionButton 
                status={product.status}
                onActivate={activate}
                onDeactivate={deactivate}
            />
        </div>
    );
};
```

## Common Development Tasks

### Adding a New Product

1. **Create Product Class**: Extend base `Product` class in `src/products/`
2. **Register Product**: Add to products list in `src/class-products.php`
3. **Add React Components**: Create product card and interstitial components
4. **Add Routes**: Update routing in `constants.ts` and `admin.jsx`
5. **Add Tests**: Create unit tests for both PHP and React components

### Modifying Product Status Logic

1. **Update Product Class**: Override `get_status()` method with new logic
2. **Handle in Frontend**: Update React components to handle new status
3. **Add Tests**: Test new status conditions and UI behavior

### Adding New API Endpoints

1. **Create REST Controller**: Extend `WP_REST_Controller` in `src/`
2. **Register Routes**: Add registration in `Initializer::register_rest_endpoints()`
3. **Frontend Integration**: Create React hooks for API consumption
4. **Add Tests**: Test API endpoints and frontend integration

### Working with Features

- **Feature Flags**: Use ExPlat integration for gradual rollouts
- **Licensing**: Integrate with Jetpack licensing system
- **Connection**: Handle WordPress.com connection requirements
- **Analytics**: Add tracking for user interactions

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
- `_inc/data/` - API hooks and data management

### Configuration Files
- `package.json` - Dependencies and scripts
- `webpack.config.js` - Build configuration
- `babel.config.js` - JavaScript transpilation
- `tsconfig.json` - TypeScript configuration

## API Endpoints

### REST API Patterns
- **Base namespace**: `jetpack/v4/my-jetpack`
- **Products endpoint**: `/products` - main product data and actions
- **Purchases endpoint**: `/purchases` - user purchase information
- **Feature endpoints**: Various feature-specific endpoints

### Standard REST Controller Pattern
See the complete REST API endpoint example in the PHP Patterns section above for full implementation details.

### Data Flow
1. React components call API via `apiFetch`
2. WordPress routes to appropriate REST controller
3. Controller validates permissions and processes request
4. Product classes handle business logic
5. Response returned to frontend for UI updates

## Debugging & Troubleshooting

### Testing Patterns

#### PHP Unit Tests
```php
class Test_My_Product extends WP_UnitTestCase {
    
    public function test_get_status_returns_active_when_plugin_installed() {
        $product = new My_Product();
        $this->assertEquals('active', $product->get_status());
    }
}
```

#### React Component Tests
```jsx
import { render, screen } from '@testing-library/react';
import MyComponent from './index';

test('renders component correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('My Component')).toBeInTheDocument();
});
```

## Integration Notes

### WordPress.com Connection
- Required for most product functionality
- Handled by `@automattic/jetpack-connection` package
- Check connection status before product actions

### Jetpack Licensing
- Managed by `@automattic/jetpack-licensing` package
- Product purchases and plan validation
- License key management

### Asset Loading
- Assets enqueued via `Automattic\Jetpack\Assets` class
- Textdomain replacement for translations
- RTL support for stylesheets

This documentation should help you understand and work with the My Jetpack codebase effectively.
