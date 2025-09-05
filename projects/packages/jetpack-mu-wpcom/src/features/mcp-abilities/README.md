# MCP Abilities Feature

This feature provides the complete WordPress.com MCP (Model Context Protocol) implementation for WordPress.com, Atomic, and Jetpack sites.

## Overview

The MCP Abilities system provides a memory-efficient, configuration-driven architecture for creating MCP abilities. It includes:

- **Complete MCP Implementation**: 50+ PHP classes covering all MCP functionality
- **Configuration-Driven**: Single source of truth in `AbilitiesRegistry/abilities-config.php`
- **Memory Efficient**: Lightweight abilities + heavy executors pattern
- **Server Support**: Both default and site-level MCP servers
- **Transport Layer**: WordPress.com REST API integration
- **Error Handling**: Comprehensive error handling and observability

## Dependencies

- **PHP**: >= 8.1
- **wordpress/mcp-adapter**: dev-trunk (provides `wp_register_ability()` and related functions)

## Architecture

The system separates concerns into:

- **Abilities**: Lightweight classes that handle registration and delegate execution
- **Executors**: Heavy classes containing the actual execution logic (only loaded when needed)
- **Registry**: Configuration-driven system that eliminates hardcoded ability names
- **Factory**: Creates executor instances on-demand with caching

## Usage

The MCP system is automatically initialized when this feature is loaded. Individual ability classes use the WordPress Abilities API (`wp_register_ability()`) from the MCP adapter.

## Files

- `index.php` - Feature entry point
- `WpcomMcp.php` - Main MCP class
- `AbilitiesRegistry/` - Complete abilities registry system
- `Servers/` - MCP server implementations
- `Transport/` - WordPress.com REST API transport
- `ErrorHandlers/` - Error handling system
- `ObservabilityHandlers/` - Observability and logging
- `Infrastructure/` - Core infrastructure classes

## Integration

This feature integrates with the `wordpress/mcp-adapter` package to provide MCP functionality across WordPress.com, Atomic, and Jetpack sites.
