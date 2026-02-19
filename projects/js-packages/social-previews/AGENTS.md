# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [Social Previews README.md](./README.md) - Package overview and usage examples

## Project Overview

Social Previews is a React component library that renders visual previews of how a post will appear when shared on various social media platforms. Published as `@automattic/social-previews` on npm.

This package is consumed by the Publicize package (`projects/packages/publicize/`) to show previews in the block editor sidebar. It is also used by the Jetpack plugin (`projects/plugins/jetpack/`) to show the site SEO search preview.

## Platform Preview Pattern

Each supported platform follows a consistent directory structure under `src/`:

```text
src/{platform}-preview/
├── index.tsx            # Exports (re-exports components and types)
├── previews.tsx         # Container: renders both post and link previews with section headings
├── post-preview.tsx     # "Your post" preview — how the shared post appears in a feed
├── link-preview.tsx     # "Link preview" — how a shared link card appears (optional for some platforms)
├── types.ts             # Platform-specific prop types extending SocialPreviewBaseProps
├── style.scss           # Platform-specific styles
└── helpers.ts           # Utility functions (optional)
```

The Facebook preview (`src/facebook-preview/`) is the most complete reference implementation of this pattern.

### Shared Types

`src/types.ts` defines the base interfaces:
- `SocialPreviewBaseProps` — Common props: `url`, `title`, `description`, `image`, `media`, `caption`
- `SocialPreviewsBaseProps` — Container-level props: `headingLevel`, `hidePostPreview`, `hideLinkPreview`
- `MediaItem` — Media attachment type: `url`, `type` (MIME), `alt`

### Shared Components

`src/shared/` contains reusable UI primitives used across platform previews (section headings, etc).

## Supported Platforms

Each platform has its own `src/{platform}-preview/` directory. See `src/index.ts` for the current list of exported platforms.

## Adding a New Platform

1. Create `src/{platform}-preview/` directory following the pattern above
2. Define platform-specific types extending `SocialPreviewBaseProps` in `types.ts`
3. Implement `post-preview.tsx` (required) and `link-preview.tsx` (if the platform shows link cards)
4. Create `previews.tsx` container that composes both preview types with section headings
5. Export everything from `index.tsx`
6. Add the export to `src/index.ts`
7. Add styles in `style.scss` — use `src/variables.scss` for shared design tokens

## Testing

```bash
jetpack test js js-packages/social-previews    # Run Jest tests
```

Tests live under the `tests/` directory. Use React Testing Library for component tests.
