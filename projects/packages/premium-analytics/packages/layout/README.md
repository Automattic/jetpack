# @automattic/jetpack-premium-analytics-layout

Layout primitives for Jetpack Premium Analytics.

## Overview

Provides shared page-level layout components used by routes and widget hosts —
currently a single `BaseLayout` that stacks a header above its children with
a consistent gap.

## Components

### `<BaseLayout header={…}>{ … }</BaseLayout>`

Renders a vertical [`Stack`](https://github.com/WordPress/gutenberg/tree/trunk/packages/ui)
with `gap="lg"`. The `header` slot sits above the children.

```tsx
import { BaseLayout } from '@automattic/jetpack-premium-analytics-layout';

<BaseLayout header={ <PageHeader /> }>
	<WidgetGrid />
</BaseLayout>;
```

**Props:**

- `header`: `React.ReactNode` — content rendered above the children.
- `children`: `React.ReactNode` — main page content.

## Dependencies

- `@wordpress/ui` — provides the `Stack` primitive.
