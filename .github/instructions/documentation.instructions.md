---
applyTo: "**/*.md,**/README.md,docs/**/*"
excludeAgent: "coding-agent"
---

# Documentation Instructions

## Documentation Files

Documentation in the Jetpack Monorepo helps developers understand and contribute to the project.

## Types of Documentation

- `README.md` - Project overview, installation, usage
- `CONTRIBUTING.md` - How to contribute
- `CHANGELOG.md` - Generated from changelog entries (don't edit manually)
- `/docs/*.md` - Developer documentation
- Inline code documentation (PHPDoc, JSDoc, TSDoc)

## Markdown Style

- Use clear, concise language
- Use headings hierarchically (h1, h2, h3)
- Use code blocks with language hints
- Use lists for sequential steps or related items
- Use tables for structured data
- Include examples where helpful

## README Files

Should typically include:
1. Title and brief description
2. Installation/setup instructions
3. Usage examples
4. Configuration options
5. Development instructions
6. Testing instructions
7. Links to additional documentation

## Code Documentation

### PHP (PHPDoc)

```php
/**
 * Brief description of function.
 *
 * Longer description if needed.
 *
 * @since $$next-version$$
 * @param string $param Description of parameter.
 * @return bool Description of return value.
 */
function example_function( $param ) {
    // ...
}
```

### JavaScript/TypeScript (JSDoc/TSDoc)

```typescript
/**
 * Brief description of function.
 *
 * Longer description if needed.
 *
 * @param {string} param - Description of parameter.
 * @returns {boolean} Description of return value.
 */
function exampleFunction(param: string): boolean {
    // ...
}
```

## Documentation Best Practices

- Keep documentation up-to-date with code changes
- Document public APIs thoroughly
- Explain why, not just what (code shows what)
- Include examples for complex functionality
- Link to related documentation
- Use proper spelling and grammar
- Use active voice
- Be concise but clear

## Changelog Entries

Generated from `changelog/` entries via `jetpack changelog add`:
- Write from user perspective
- Use imperative mood
- Start with capital, end with period
- Include component prefix when relevant
- See `/docs/writing-a-good-changelog-entry.md` for details

## Special Files

- `$$next-version$$` placeholder: Used in @since/@deprecated tags, replaced during release
- `CODEOWNERS` - Defines code ownership for automatic review assignment
- `to-test.md` - Testing instructions for releases

## Links

- Use relative links for internal documentation
- Use absolute links for external resources
- Verify links are not broken
- Use descriptive link text (not "click here")
