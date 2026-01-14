---
applyTo: "projects/packages/**/*.php"
---

# PHP Packages Instructions

## Package Structure

PHP packages in `projects/packages/` are Composer packages with the naming convention `automattic/jetpack-{name}`.

## Key Files

- `composer.json` - Package metadata and dependencies
- `bootstrap.php` - Package initialization (if needed)
- `src/` - Source code
- `tests/` - PHPUnit tests
- `phpunit.xml.dist` - PHPUnit configuration
- `CHANGELOG.md` - Generated from changelog entries
- `changelog/` - Changelog entry files

## PHP Standards

- Must be compatible with PHP 7.2-8.5 (WordPress minimum requirements)
- Follow WordPress Core coding standards
- Use WordPress coding style (spaces, not tabs for PHP)
- All public APIs must have complete PHPDoc documentation
- Include `@since` tags (use `$$next-version$$` placeholder for new additions)

## Testing

- Write PHPUnit tests for all new functionality
- Tests should be in `tests/php/` directory
- Run tests: `jetpack test` and select the package
- Mock WordPress functions using Brain\Monkey or similar

## Deprecation

When deprecating code:
- Use `_deprecated_function()`, `_deprecated_file()`, or `_deprecated_class()`
- Add `@deprecated $$next-version$$` PHPDoc tag
- Keep deprecated code for minimum 6 months
- Provide replacement function/method in deprecation notice

## Dependencies

- Use Composer for PHP dependencies
- Prefer existing Jetpack packages over external dependencies
- Document any external dependencies in PR description
- Check for security vulnerabilities in dependencies

## Common Patterns

- Use `jetpack_require_lib()` for loading library files
- Use PSR-4 autoloading (configured in composer.json)
- Namespace should match package structure: `Automattic\Jetpack\{PackageName}`
