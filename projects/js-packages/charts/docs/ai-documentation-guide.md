# AI Documentation Guide for Automattic Charts

This guide provides instructions for AI agents to generate comprehensive documentation for chart components and features following the established patterns in `@automattic/charts`.

## Documentation Structure Template

All chart documentation should follow this standardized structure:

### 1. File Header & Imports

```mdx
import { Meta, Canvas, Story, Source } from '@storybook/addon-docs/blocks';
import * as [FeatureName]Stories from './[feature-name].stories';

<Meta title="JS Packages/Charts/[Category]/[Component]/[Feature]" of={ [FeatureName]Stories } />
```

### 2. Title & Introduction

```mdx
# [Component] [Feature Name]

Brief 1-2 sentence description of what this feature does and its primary use case.

<Canvas of={ [FeatureName]Stories.Default } />
```

### 3. Overview Section

Always include:

- High-level explanation of the feature
- Basic code example showing the compound component pattern
- Key concepts or terminology

```mdx
## Overview

The [Component] component supports [feature description], providing [benefits]:

<Source
	language="jsx"
	code={ `import { [Component] } from '@automattic/charts';

    <[Component] data={ data }>
    	<[Component].[FeatureComponent]>
    		<[Component].[SubComponent]
    			[key-props]
    		/>
    	</[Component].[FeatureComponent]>
    </[Component]>` }

/>
```

### 4. Basic Usage Section

```mdx
## Basic Usage

### Basic [Feature Name]

Description of simplest implementation:

<Canvas of={ [FeatureName]Stories.Default } />

<Source language="jsx" code={ `[minimal-example]` } />

### Required Props

- **`propName`**: Description of what this prop does
- **`anotherProp`**: Description

### Optional Props

- **`optionalProp`**: Description and default behavior
- **`anotherOptional`**: Description
```

### 5. Feature Variations

Document all major variations with:

- Descriptive subsection title
- Canvas example
- Code snippet
- Explanation of when to use

```mdx
## [Feature] Types

### [Variation Name] (Default/Primary)

Description of this variation:

<Canvas of={ [FeatureName]Stories.[VariationName] } />

### [Another Variation]

Description and use case:

<Canvas of={ [FeatureName]Stories.[AnotherVariation] } />

<Source language="jsx" code={ `example-code` } />
```

### 6. Styling and Customization

```mdx
## Styling and Customization

### Custom [Styling Aspect]

How to customize appearance:

<Canvas of={ [FeatureName]Stories.Styled } />

<Source language="jsx" code={ `styling-example` } />

### Styling Options

The `styles` prop accepts the following nested objects:

#### `[styleCategory]`

Controls [what this category affects]:

- `property`: Description and possible values
- `anotherProperty`: Description

### Theme Integration

Explanation of how feature integrates with chart themes.
```

### 7. Advanced Features

Document complex functionality:

```mdx
## Advanced Features

### [Advanced Feature Name]

Explanation of complex functionality with examples.

### [Another Advanced Feature]

More advanced usage patterns.
```

### 8. Accessibility Section

Always include accessibility information:

```mdx
## Accessibility

### Keyboard Navigation

- Key interactions and behaviors

### Screen Reader Support

- ARIA attributes and labels
- Any limitations or considerations

### Focus Management

- Focus behavior and visual indicators
```

### 9. Browser Compatibility

Include any browser-specific considerations:

```mdx
## Browser Compatibility

### [Browser Name] Considerations

Any browser-specific behaviors or workarounds.

### [API/Feature] Support

Information about feature support and fallbacks.
```

### 10. API Reference

Comprehensive prop documentation:

````mdx
## API Reference

### [Component].[SubComponent]

Description of the component.

**Props:**

- `children`: Description

### [Component].[MainComponent]

Description of main component.

**Props:**
| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `requiredProp` | `Type` | - | **Required.** Description |
| `optionalProp` | `Type \| Other` | `default` | Description |

### [TypeName] Type

```typescript
type TypeName = {
	property: Type;
	optional?: Type;
};
```
````

````

### 11. Migration
```mdx
## Migration from [Legacy/Previous API]
If applicable, provide migration examples:

<Source language="jsx" code={`
// Old API
[old-example]

// New API
[new-example]
`} />
````

## Content Guidelines

### Writing Style

- **Be concise but comprehensive**: Each section should be thorough but not verbose
- **Use active voice**: "Annotations allow you to..." vs "You can use annotations to..."
- **Include practical examples**: Always show real code that users can copy-paste
- **Explain the "why"**: Don't just document what props do, explain when to use them

### Code Examples

- **Always use realistic data**: Show complete, runnable examples
- **Follow TypeScript patterns**: Include proper typing in examples
- **Use consistent naming**: `data`, `dataPoint`, `sampleData` for chart data
- **Show progressive complexity**: Start simple, build up to advanced usage

### Canvas Examples

- **Every major feature needs a visual**: Use `<Canvas of={ Story } />`
- **Order logically**: Default → Basic variations → Advanced → Custom
- **Keep stories focused**: Each story should demonstrate one clear concept

### Props Documentation

- **Mark required props clearly**: Use bold "**Required.**" prefix
- **Include defaults**: Show what happens if prop is omitted
- **Type information**: Always include TypeScript types
- **Practical descriptions**: Explain impact and use cases, not just data types

### Cross-References

- **Link to related documentation**: Reference other chart features when relevant
- **Reference external docs**: Link to third-party libraries (visx, etc.) when applicable

## File Organization

### File Naming

- Main docs: `[feature-name].docs.mdx`
- Stories: `[feature-name].stories.tsx`
- Tests: `[feature-name].test.tsx`

### Directory Structure

```
src/components/[chart-type]/stories/
├── [feature-name].docs.mdx
├── [feature-name].stories.tsx
└── [feature-name].test.tsx
```

### Storybook Integration

- Use consistent story naming: `Default`, `Styled`, `Custom`, `[VariationType]`
- Group related stories logically in Storybook hierarchy
- Include descriptive story descriptions for context

## Quality Checklist

Before considering documentation complete, verify:

### Completeness

- [ ] All props documented with types and descriptions
- [ ] Visual examples for all major variations
- [ ] Code examples are complete and runnable
- [ ] Accessibility considerations covered
- [ ] Browser compatibility notes included

### Accuracy

- [ ] Code examples match actual implementation
- [ ] Type definitions are current
- [ ] Examples use current API patterns

### Usability

- [ ] Progressive complexity (simple → advanced)
- [ ] Clear section headings and navigation
- [ ] Practical use case examples
- [ ] Migration guidance where applicable

### Standards Compliance

- [ ] Follows compound component patterns
- [ ] Uses established styling conventions
- [ ] Integrates with chart theming system
- [ ] Maintains accessibility standards

## Using the Feature Documentation Template

AI agents should use the provided `feature-documentation.mdx.template` as a starting point for any new chart feature documentation:

1. **Copy the template**: Start with `feature-documentation.mdx.template`
2. **Replace all bracketed placeholders**: Fill in `[Component]`, `[FeatureName]`, `[feature-name]`, etc. with actual values
3. **Follow the structure**: Keep all sections but adapt content to your specific feature
4. **Remove irrelevant sections**: If your feature doesn't have certain capabilities (e.g., no interactive features), remove those sections
5. **Add feature-specific sections**: Include additional sections if your feature has unique aspects not covered in the template

The template includes all the standard sections, proper MDX formatting, and placeholder text to guide content creation.

## Example Analysis

The `annotation.docs.mdx` file exemplifies these patterns:

1. **Clear structure**: Logical flow from basic to advanced
2. **Visual examples**: Every feature variation has a Canvas example
3. **Complete API docs**: Comprehensive prop tables with types
4. **Practical guidance**: Real-world usage scenarios and best practices
5. **Accessibility focus**: Dedicated section covering keyboard, screen reader, and focus behavior
6. **Browser considerations**: Honest discussion of Safari limitations
7. **Migration support**: Clear guidance for upgrading from legacy API

Follow this structure and level of detail for all chart component documentation to ensure consistency and usefulness across the entire charts library. Examples and stories are accessible through the Storybook UI, so they don't need to be listed in the documentation.

**Important**: When documenting performance considerations, only include optimizations and limitations that are actually implemented, documented, or evidenced in the codebase. Avoid general web development best practices unless they are specifically relevant and tested for the chart components.
