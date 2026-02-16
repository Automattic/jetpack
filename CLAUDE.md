# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is the Jetpack Monorepo containing multiple WordPress plugins, Composer packages, and JavaScript packages:

- **projects/plugins/**: Individual Jetpack plugins (jetpack, backup, boost, protect, social, etc.)
- **projects/packages/**: Reusable PHP Composer packages shared across projects
- **projects/js-packages/**: Reusable JavaScript/TypeScript packages

## Development Commands

### Building Projects
- `jetpack build [project]` - Build a specific project (e.g., `jetpack build plugins/jetpack --deps`)
- `jetpack watch` - Continuous build with file watching
- `pnpm install` - Install JavaScript dependencies
- `composer install` - Install PHP dependencies

### Testing
- `jetpack test` - Run tests interactively (choose project and test type)
- `jetpack docker phpunit [project]` - Run PHP unit tests in Docker
- `pnpm test` - Run JavaScript tests (from project root)
- `composer phpcs:lint` - Run PHP CodeSniffer
- `pnpm typecheck` - Run TypeScript type checking

### Linting and Code Quality
- `pnpm lint` - Lint JavaScript/TypeScript files
- `composer phpcs:lint` - Lint PHP code
- `composer phpcs:fix` - Auto-fix PHP code style issues
- `pnpm reformat-files` - Format JavaScript/JSON files with Prettier

### Docker Development
- `jetpack docker up -d` - Start Docker containers
- `jetpack docker install` - Install WordPress in Docker
- `jetpack docker sh` - Access Docker shell
- Site accessible at http://localhost but tunneled to http://cg4.jurassic.tube

## Code Standards and Practices

### PHP Development
- Follow WordPress PHP Coding Standards
- Use `$$next-version$$` for package version annotations in DocBlocks
- Implement proper WordPress nonce verification and security practices
- Use WordPress prefixes for functions and classes
- Structure plugin hooks logically following WordPress conventions

### JavaScript/React Development  
- Use `@wordpress/element` instead of direct React imports
- Follow WordPress component patterns and hooks system
- Use `@wordpress/i18n` for translations with unique text domains
- Use WordPress data stores for state management
- Use `@babel/preset-typescript` for TypeScript in Webpack (not `ts-loader`)

### Architecture Patterns
- Survey existing packages for reusable functionality before creating new dependencies
- Follow established naming conventions and file organization patterns
- Maintain consistency with existing implementation patterns
- Prioritize internal packages over external dependencies
- Consider backwards compatibility when modifying shared code

## Key Development Notes

- The monorepo should NOT be cloned into the WordPress plugins directory
- Use Docker environment for development (recommended and supported)
- Enable debugging with `WP_DEBUG`, `SCRIPT_DEBUG`, and `JETPACK_DEV_DEBUG` constants
- Use `jetpack draft enable/disable` to manage pre-commit hooks during major refactoring
- Use Jurassic Tube for testing WordPress.com connection features, i.e., cg4.jurassic.tube
- The underlying WordPress structure can be found at tools/docker/wordpress directory, this directory can be scanned to better understand WordPress classes and functions

## Testing WordPress.com Features

Local HTTP tunnels are required for testing features that need WordPress.com connection:
- For Automatticians: Use Jurassic Tube
- For others: Use ngrok or similar services

## Environment Setup

Run `tools/check-development-environment.sh` to verify your development environment is properly configured. All green messages indicate readiness for development.

Required tools: Node.js, pnpm, PHP, Composer, Docker, Jetpack CLI