# Jetpack MCP Package

Provides MCP (Model Context Protocol) ability registry and related functionality for Jetpack. This package enables cross-platform MCP support across WPCOM, Atomic, and self-hosted Jetpack sites.

## Features

- **Complete Abilities Registry**: Port of the WordPress.com MCP Abilities Registry
- **Cross-Platform Support**: Works on WPCOM, Atomic, and self-hosted sites
- **Memory Efficient**: Configuration-driven architecture with lazy loading
- **Extensible**: Easy to add new abilities and executors
- **Integration Ready**: Powers site settings and MCP server functionality

## What's Included

This package contains the complete AbilitiesRegistry system:

- **Registry/AbilityRegistry.php** - Main registry class with lookup methods
- **abilities-config.php** - Central configuration for all abilities
- **Abilities/** - Lightweight ability classes (User, Post, Analytics, etc.)
- **Executors/** - Heavy execution logic classes
- **Interfaces/** - Contracts for abilities and executors
- **Traits/** - Shared functionality and user context
- **Helpers/** - Utility classes for common operations
- **Factories/** - On-demand executor creation with caching

## Usage

### Getting MCP Abilities

```php
use Automattic\Jetpack\AbilitiesRegistry\Registry\AbilityRegistry;

// Get all resources for site-level server
$resources = AbilityRegistry::get_resources_for_server( 'site-level' );

// Get all tools for site-level server  
$tools = AbilityRegistry::get_tools_for_server( 'site-level' );

// Get all prompts for site-level server
$prompts = AbilityRegistry::get_prompts_for_server( 'site-level' );

// Get metadata for a specific ability
$metadata = AbilityRegistry::get_metadata( 'wpcom-mcp/posts-search' );
```

### Available Abilities

The package includes these ability categories:

- **User Abilities**: Profile, sites, achievements, connections, notifications, security, subscriptions
- **Post Abilities**: Search, retrieval, and management
- **Analytics Abilities**: Site statistics and metrics
- **Example Abilities**: Templates for creating new abilities

### Integration

This package integrates with:
- **Site Settings API**: Provides MCP abilities to the site settings endpoint
- **MCP Servers**: Used by MCP servers to determine available abilities
- **WordPress Admin**: Powers MCP ability configuration in WordPress admin

## Architecture

The Abilities Registry uses a memory-efficient, configuration-driven architecture:

- **Abilities**: Lightweight classes that handle registration and delegate execution
- **Executors**: Heavy classes containing the actual execution logic (only loaded when needed)
- **Registry**: Configuration-driven system that eliminates hardcoded ability names
- **Factory**: Creates executor instances on-demand with caching

## How to install mcp

### Installation From Git Repo

This package is part of the Jetpack monorepo and is automatically available when Jetpack is installed.

## Contribute

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

mcp is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

