# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [My Jetpack README.md](./README.md) - Complete architecture, development commands, and project structure

**Additional Resources**:

- [Data Layer Documentation](./_inc/data/README.md) - API hooks and data management
- [Automated Testing Overview](../../../docs/automated-testing.md) - Testing patterns and strategies
- [Coding Standards & Guidelines](../../../docs/coding-guidelines.md) - Development best practices  
- [Jetpack HTTP API Documentation](../../../docs/rest-api.md) - REST API patterns
- [Jetpack CLI Documentation](../../../tools/cli/README.md) - CLI commands and workflows

## Project Overview

My Jetpack is a centralized WordPress admin page providing a unified interface for managing Jetpack products and services. Key architectural components:

- **PHP Backend**: Product management system, REST API endpoints (`jetpack/v4/my-jetpack` namespace)
- **React Frontend**: TypeScript application with React Router and TanStack React Query for data management
- **Product System**: Standardized `Product` class interface with status constants for lifecycle management

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

For comprehensive REST API documentation and patterns, see [Jetpack HTTP API Documentation](../../../docs/rest-api.md).

My Jetpack endpoints follow the standard pattern:

- **Namespace**: `jetpack/v4/my-jetpack`
- **Base**: Extend `WP_REST_Controller`
- **Registration**: Via `Initializer::register_rest_endpoints()`

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

## Development Quick Reference

### Key Technologies

Check [package.json](./package.json) for current versions:

- **React** with TypeScript
- **Data Management**: @tanstack/react-query for server state
- **Routing**: react-router
- **Charts**: @automattic/charts (workspace package) for data visualization
- **Styling**: Sass modules with CSS Modules
- **Testing**: Jest with React Testing Library

### TanStack Query Integration

**Base Hook**: `useSimpleQuery` - Wrapper around TanStack Query for common patterns

### Styling Architecture

**Sass Modules**: `.module.scss` files with CSS Modules
**Base Styles**: `@automattic/jetpack-base-styles` for common patterns
**Naming Convention**: BEM methodology in SCSS modules

**Key Style Files**:

- `_inc/style.module.scss`: Main application styles
- Component-specific: `component-name/style.module.scss`

### GitHub CLI for PR Management

When working with pull requests (e.g., #44191), use the GitHub CLI for efficient review and management:

```bash
gh pr view 44191                    # View PR details and description
gh pr view 44191 --comments         # View PR with all comments
gh pr diff 44191                    # View the diff/changes
```

### Testing & Integration

**Testing**: PHPUnit for PHP, Jest + React Testing Library for JavaScript
**Integration**: WordPress.com connection via `@automattic/jetpack-connection`, licensing via `@automattic/jetpack-licensing`
**Workflows**: See [README.md](./README.md) for adding products, API development, and feature implementation
