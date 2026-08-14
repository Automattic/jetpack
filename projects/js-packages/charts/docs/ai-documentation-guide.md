# AI Documentation Guide for Automattic Charts

This guide provides instructions for AI agents to generate comprehensive documentation for chart components and features following the established patterns in `@automattic/charts`.

## Documentation Structure Template

All chart documentation should follow this standardized structure:

### 1. File Header & Imports

```mdx
import { Meta, Canvas, Story, Source } from '@storybook/addon-docs/blocks';
import * as [FeatureName]Stories from './[feature-name].stories';

<Meta title="JS Packages/Charts Library/[Category]/[Component]/[Feature]" of={ [FeatureName]Stories } />
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
	language="tsx"
	code={ `import { [Component] } from '@automattic/charts';

    	<[Component] data={ data }>
    		<[Component].[FeatureComponent]>
    			<[Component].[SubComponent]
    				[key-props]
    			/>
    		</[Component].[FeatureComponent]>
    	</[Component]>
    ` }

/>
```

### 4. API Reference Section (Link)

Immediately after the overview, include a link to the separate API reference document:

```mdx
## API Reference

For detailed information about component props, types, and method signatures, see the [[Component] API Reference](./?path=/docs/js-packages-charts-library-[category]-[component]-api-reference--docs).
```

#### Creating the Separate API Reference Document

The API reference should be created as a separate MDX document using the `feature-api-documentation.mdx.template`. This document will appear as a separate entry in Storybook below the main 'Docs' entry.

```mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="JS Packages/Charts Library/[Category]/[Component]/[Feature]/API Reference" />

# [Feature Name] API Reference

[Use the feature-api-documentation.mdx.template structure]
```

The separate API reference should include:

- Complete component prop tables with types, defaults, and descriptions
- TypeScript type definitions
- Required vs optional prop distinctions

The API reference should NOT include:

- Usage examples or code snippets
- Usage patterns or best practices
- Integration examples
- Notes about behavior

All usage documentation, code examples, patterns, and behavioral notes belong in the main documentation file. The API reference is strictly for technical specifications.

This separation allows users to:

- Quickly access examples and usage patterns in the main docs
- Reference detailed API information when needed
- Navigate Storybook more efficiently with focused documentation
- Find all usage examples in one place (main docs) rather than scattered across files

### 5. Basic Usage Section

```mdx
## Basic Usage

### Basic [Feature Name]

Description of simplest implementation:

<Canvas of={ [FeatureName]Stories.Default } />

<Source language="tsx" code={ `[minimal-example]` } />

### Required Props

- **`propName`**: Description of what this prop does
- **`anotherProp`**: Description

### Optional Props

For detailed information about all optional props, see the [[Component] API Reference](./?path=/docs/js-packages-charts-library-[category]-[component]-api-reference--docs).
```

### 6. Feature Variations

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

<Source language="tsx" code={ `example-code` } />
```

### 7. Interactive Features

Only include this section if the chart supports interactive features (e.g., tooltips, pointer events). Remove this section entirely if the chart has no interactive capabilities.

Document the chart's interactive capabilities:

- **Tooltips**: How to enable tooltips with `withTooltips`, custom rendering with `renderTooltip`, and crosshair options where supported
- **Pointer Events**: Custom event handlers (`onPointerDown`, `onPointerMove`) if supported
- **Keyboard Navigation**: Standard keyboard interactions (Tab, Arrow Keys, Enter/Space, Escape)

See the `feature-documentation.mdx.template` for the complete section structure.

### 8. Legends

Only include this section if the chart supports legends. Remove this section entirely if the chart has no legend capabilities.

Show a single basic example using the composition API (`<[Component].Legend />`), then link to the Legend component docs for full configuration (positioning, orientation, shapes, interactivity, etc.). Do not duplicate legend configuration details in each chart's docs — the Legend component docs are the single source of truth.

If the chart has a chart-specific legend prop not covered by the Legend component (e.g. `legendLabels` on LeaderboardChart), include a brief example for that prop.

See the `feature-documentation.mdx.template` for the complete section structure.

### 9. Styling and Customization

```mdx
## Styling and Customization

### Custom [Styling Aspect]

How to customize appearance:

<Canvas of={ [FeatureName]Stories.Styled } />

<Source language="tsx" code={ `styling-example` } />

### Styling Options

The `styles` prop accepts the following nested objects:

#### `[styleCategory]`

Controls [what this category affects]:

- `property`: Description and possible values
- `anotherProperty`: Description
```

### 10. Theming Integration

Use the standardized format from the `feature-documentation.mdx.template`. This section should be a top-level `##` heading (not nested under Styling) and include:

- A description explaining that the chart integrates seamlessly with the theming system
- An explanation that the default theme has neutral colors and styling
- A code example showing how to wrap the chart in `GlobalChartsProvider` with a custom theme

See the template for the complete section structure.

### 11. Responsive Behavior

Always include a Responsive Behavior section. Charts are responsive by default and fill their parent container's dimensions. Document:

- Default behavior (fills parent container, parent needs explicit height)
- `aspectRatio` prop usage (height calculated from width)
- Fixed `width`/`height` dimensions
- Any chart-specific responsive nuances (e.g., aspect ratio constraints)

End the section with a link to the Responsive Design section in the introduction.

See the `feature-documentation.mdx.template` for the complete section structure.

### 12. Animation

Only include this section if the chart component supports animation (check the implementation for an `animation` prop). If animation is not supported, remove this section entirely.

When documenting animation:

- Show the Animation story with a Canvas example
- Include a basic code example with `animation={true}`
- Document animation behavior in a bulleted list covering:
  - Opt-in nature (disabled by default)
  - Accessibility (respects `prefers-reduced-motion`)
  - Effect description (e.g., "radial wipe reveal effect")
  - Duration in milliseconds
- Note that animation plays once on initial render and does not repeat

See the `feature-documentation.mdx.template` for the complete section structure.

### 13. Advanced Usage

Document complex functionality with practical examples. All usage examples, including advanced patterns, should be in the main documentation file, NOT in the API reference:

```mdx
## Advanced Usage

### [Advanced Feature Name]

Explanation of complex functionality with examples:

<Source language="tsx" code={ `[comprehensive-example]` } />

### [Another Advanced Feature]

More advanced usage patterns with code examples:

<Source language="tsx" code={ `[advanced-pattern-example]` } />

### Important Notes

- Key behavioral notes
- Best practices
- Common pitfalls to avoid
```

### 14. Accessibility Section

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

### 15. Migration

```mdx
## Migration from [Legacy/Previous API]

If applicable, provide migration examples:

<Source language="tsx" code={`
	// Old API
	[old-example]

    // New API
    [new-example]
    `} />
```

## Content Guidelines

### Writing Style

- **Be concise but comprehensive**: Each section should be thorough but not verbose
- **Use active voice**: "Annotations allow you to..." vs "You can use annotations to..."
- **Include practical examples**: Always show real code that users can copy-paste
- **Explain the "why"**: Don't just document what props do, explain when to use them

### Code Examples

- **Always use realistic data**: Show complete, runnable examples
- **Follow TypeScript patterns**: Include proper typing in examples
- **Use `tsx` for component code**: All `<Source>` blocks with tsx/component code should use `language="tsx"`, use `language="typescript"` only for pure type definitions or imports
- **Use tabs for indentation**: All code examples in `<Source>` blocks must use tabs, not spaces, for indentation
- **Author `<Source>` templates for the dedent**: Storybook dedents `<Source code={ \`...\` } />` blocks by one level before rendering. Keep the leading imports/setup paragraph flush at column 0, then indent the JSX body one level (opening tag at one tab, props at two tabs, closing tag back at one tab). Do not run Prettier over `.mdx` — it will mix tabs and spaces and break the dedent. See the "Authoring `<Source>` example blocks" section of the `charts-docs` skill for the full convention and a self-check.
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
- API reference: `[feature-name].api.mdx`
- Stories: `[feature-name].stories.tsx`

### Directory Structure

```
src/components/[chart-type]/stories/
├── [feature-name].docs.mdx
├── [feature-name].api.mdx
├── [feature-name].stories.tsx
```

### Storybook Integration

- Use consistent story naming: `Default`, `Styled`, `Custom`, `[VariationType]`
- Group related stories logically in Storybook hierarchy
- Include descriptive story descriptions for context

## Quality Checklist

Before considering documentation complete, verify both main docs and API reference:

### Completeness

- [ ] Main docs: All usage patterns and examples documented
- [ ] API docs: All props documented with types and descriptions
- [ ] API docs: Contains NO usage examples or code snippets
- [ ] Visual examples for all major variations in main docs
- [ ] Code examples are complete and runnable in main docs
- [ ] Accessibility considerations covered in main docs
- [ ] Animation section included if chart supports animation (check for `animation` prop)
- [ ] Both documents created using appropriate templates

### Accuracy

- [ ] Code examples match actual implementation
- [ ] API reference type definitions are current and accurate
- [ ] Examples use current API patterns
- [ ] Prop names and types match between documents
- [ ] Cross-references between docs are accurate

### Usability

- [ ] Main docs: Progressive complexity (simple → advanced)
- [ ] Clear section headings and navigation in both documents
- [ ] Practical use case examples in main docs
- [ ] Migration guidance where applicable
- [ ] API reference is easily discoverable from main docs

### Standards Compliance

- [ ] Follows compound component patterns
- [ ] Uses established styling conventions
- [ ] Integrates with chart theming system
- [ ] Maintains accessibility standards
- [ ] Proper Storybook organization with separate API reference entry

## Using the Documentation Templates

AI agents should use both provided templates when creating comprehensive chart feature documentation:

### Main Feature Documentation

1. **Copy the main template**: Start with `feature-documentation.mdx.template`
2. **Replace all bracketed placeholders**: Fill in `[Component]`, `[FeatureName]`, `[feature-name]`, etc. with actual values
3. **Follow the structure**: Keep all sections but adapt content to your specific feature
4. **Remove irrelevant sections**: If your feature doesn't have certain capabilities (e.g., no interactive features), remove those sections
5. **Add feature-specific sections**: Include additional sections if your feature has unique aspects not covered in the template

### API Reference Documentation

1. **Copy the API template**: Start with `feature-api-documentation.mdx.template`
2. **Replace all bracketed placeholders**: Fill in component and type names
3. **Complete all prop tables**: Ensure comprehensive coverage of all component props
4. **Include TypeScript definitions**: Document all custom types used by the feature
5. **Use consistent naming**: Match prop names and types exactly as implemented

### Template Integration

- The main documentation focuses on usage patterns, examples, and best practices
- The API reference provides comprehensive technical details and prop specifications
- Both documents should cross-reference each other where appropriate
- Maintain consistent terminology and naming between both documents

Both templates include proper MDX formatting and placeholder text to guide content creation.

## Example Analysis

The `annotation.docs.mdx` file exemplifies these patterns:

1. **Clear structure**: Logical flow from basic to advanced
2. **Visual examples**: Every feature variation has a Canvas example
3. **Complete API docs**: Comprehensive prop tables with types
4. **Practical guidance**: Real-world usage scenarios and best practices
5. **Accessibility focus**: Dedicated section covering keyboard, screen reader, and focus behavior
6. **Migration support**: Clear guidance for upgrading from legacy API

Follow this structure and level of detail for all chart component documentation to ensure consistency and usefulness across the entire charts library. Examples and stories are accessible through the Storybook UI, so they don't need to be listed in the documentation.
