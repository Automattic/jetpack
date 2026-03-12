# ChartLayout Component Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract a shared `ChartLayout` component that encapsulates the duplicated Stack + legend positioning pattern across all 5 chart components.

**Architecture:** ChartLayout is a thin layout wrapper that renders a `Stack direction="column"` with legend slots (top/bottom) sandwiching chart content passed as children. Each chart still owns its own measurement logic, chart rendering, legend element creation, and a11y handlers. ChartLayout handles only the structural layout concern.

**Tech Stack:** React, TypeScript, SCSS modules, existing Stack/Legend components

**Linear:** CHARTS-181

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/components/chart-layout/chart-layout.tsx` | ChartLayout component |
| `src/components/chart-layout/chart-layout.module.scss` | Minimal layout styles (visibility hiding) |
| `src/components/chart-layout/index.ts` | Barrel export |
| `src/components/chart-layout/test/chart-layout.test.tsx` | Unit tests |
| `src/charts/line-chart/line-chart.tsx` | Refactor to use ChartLayout |
| `src/charts/bar-chart/bar-chart.tsx` | Refactor to use ChartLayout |
| `src/charts/pie-chart/pie-chart.tsx` | Refactor to use ChartLayout |
| `src/charts/pie-semi-circle-chart/pie-semi-circle-chart.tsx` | Refactor to use ChartLayout |
| `src/charts/leaderboard-chart/leaderboard-chart.tsx` | Refactor to use ChartLayout |

All paths relative to `projects/js-packages/charts/`.

---

## Chunk 1: ChartLayout Component

### Task 1: Create ChartLayout test file

**Files:**
- Create: `src/components/chart-layout/test/chart-layout.test.tsx`

- [ ] **Step 1: Write failing tests for ChartLayout**

```tsx
import { render, screen } from '@testing-library/react';
import { ChartLayout } from '../chart-layout';
import { renderLegendSlot } from '../../../charts/private/chart-composition';
import type { LegendChild } from '../../../charts/private/chart-composition/use-chart-children';

// Mock renderLegendSlot since we test it separately
jest.mock( '../../../charts/private/chart-composition', () => ( {
	renderLegendSlot: jest.fn( () => [] ),
} ) );

const mockRenderLegendSlot = renderLegendSlot as jest.Mock;

describe( 'ChartLayout', () => {
	beforeEach( () => {
		mockRenderLegendSlot.mockReturnValue( [] );
	} );

	it( 'renders children inside a column Stack', () => {
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ [] }>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'chart-content' ) ).toBeInTheDocument();
	} );

	it( 'renders legend element at top when legendPosition is top', () => {
		const legendElement = <div data-testid="legend">Legend</div>;
		const { container } = render(
			<ChartLayout
				legendPosition="top"
				legendElement={ legendElement }
				legendChildren={ [] }
			>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const stack = container.firstChild;
		const legend = screen.getByTestId( 'legend' );
		const content = screen.getByTestId( 'chart-content' );
		// Legend should come before content in DOM order
		expect(
			legend.compareDocumentPosition( content ) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	} );

	it( 'renders legend element at bottom when legendPosition is bottom', () => {
		const legendElement = <div data-testid="legend">Legend</div>;
		render(
			<ChartLayout
				legendPosition="bottom"
				legendElement={ legendElement }
				legendChildren={ [] }
			>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const legend = screen.getByTestId( 'legend' );
		const content = screen.getByTestId( 'chart-content' );
		// Content should come before legend in DOM order
		expect(
			content.compareDocumentPosition( legend ) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	} );

	it( 'does not render legend element when it is false/null', () => {
		render(
			<ChartLayout
				legendPosition="top"
				legendElement={ false }
				legendChildren={ [] }
			>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		expect( screen.queryByTestId( 'legend' ) ).not.toBeInTheDocument();
	} );

	it( 'calls renderLegendSlot for both positions', () => {
		const legendChildren: LegendChild[] = [];
		render(
			<ChartLayout legendPosition="bottom" legendChildren={ legendChildren }>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( mockRenderLegendSlot ).toHaveBeenCalledWith( legendChildren, 'top' );
		expect( mockRenderLegendSlot ).toHaveBeenCalledWith( legendChildren, 'bottom' );
	} );

	it( 'applies visibility hidden when isWaitingForMeasurement is true', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				isWaitingForMeasurement={ true }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'layout' ) ).toHaveStyle( { visibility: 'hidden' } );
	} );

	it( 'applies visibility visible when isWaitingForMeasurement is false', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				isWaitingForMeasurement={ false }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( screen.getByTestId( 'layout' ) ).toHaveStyle( { visibility: 'visible' } );
	} );

	it( 'does not apply visibility style when isWaitingForMeasurement is undefined', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		// No visibility in style when not opted in
		expect( screen.getByTestId( 'layout' ).style.visibility ).toBe( '' );
	} );

	it( 'passes className and style to Stack', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				className="my-chart"
				style={ { width: 400, height: 300 } }
				data-testid="layout"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		const layout = screen.getByTestId( 'layout' );
		expect( layout ).toHaveClass( 'my-chart' );
		expect( layout ).toHaveStyle( { width: '400px', height: '300px' } );
	} );

	it( 'passes gap to Stack', () => {
		const { container } = render(
			<ChartLayout
				legendPosition="bottom"
				legendChildren={ [] }
				gap="lg"
			>
				<div>Chart</div>
			</ChartLayout>
		);
		// Stack renders gap as a CSS class or style — just verify it renders without error
		expect( container.firstChild ).toBeInTheDocument();
	} );

	it( 'forwards ref to Stack', () => {
		const ref = jest.fn();
		render(
			<ChartLayout
				ref={ ref }
				legendPosition="bottom"
				legendChildren={ [] }
			>
				<div>Chart</div>
			</ChartLayout>
		);
		expect( ref ).toHaveBeenCalledWith( expect.any( HTMLElement ) );
	} );

	it( 'renders trailing content after bottom legend', () => {
		render(
			<ChartLayout
				legendPosition="bottom"
				legendElement={ <div data-testid="legend">Legend</div> }
				legendChildren={ [] }
				trailingContent={ <div data-testid="trailing">Extra</div> }
			>
				<div data-testid="chart-content">Chart</div>
			</ChartLayout>
		);
		const legend = screen.getByTestId( 'legend' );
		const trailing = screen.getByTestId( 'trailing' );
		expect(
			legend.compareDocumentPosition( trailing ) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
	} );
} );
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="chart-layout" --no-coverage`
Expected: FAIL — module not found

- [ ] **Step 3: Commit test file**

```bash
git add projects/js-packages/charts/src/components/chart-layout/test/chart-layout.test.tsx
git commit -m "Charts: Add ChartLayout component tests (red phase)"
```

---

### Task 2: Implement ChartLayout component

**Files:**
- Create: `src/components/chart-layout/chart-layout.tsx`
- Create: `src/components/chart-layout/chart-layout.module.scss`
- Create: `src/components/chart-layout/index.ts`

- [ ] **Step 4: Create the ChartLayout component**

```tsx
// chart-layout.tsx
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Stack } from '@wordpress/ui';
import { renderLegendSlot } from '../../charts/private/chart-composition';
import type { LegendChild } from '../../charts/private/chart-composition/use-chart-children';
import type { LegendPosition } from '../../types';
import type { CSSProperties, ReactNode } from 'react';
import styles from './chart-layout.module.scss';

interface ChartLayoutProps {
	/** Position for the prop-based legend element */
	legendPosition: LegendPosition;
	/** The legend element rendered via the showLegend prop (false when hidden) */
	legendElement?: ReactNode;
	/** Legend children from the composition API */
	legendChildren: LegendChild[];
	/** Chart content rendered between legend slots */
	children: ReactNode;
	/** Content rendered after the bottom legend (e.g., nonLegendChildren, htmlChildren, tooltips) */
	trailingContent?: ReactNode;
	/** When true, sets visibility: hidden on the container. Used by charts that need measurement before rendering. */
	isWaitingForMeasurement?: boolean;
	/** Gap between Stack items */
	gap?: string;
	/** Additional class names */
	className?: string;
	/** Inline styles (width, height, etc.) */
	style?: CSSProperties;
	/** Test ID for the container */
	'data-testid'?: string;
	/** Chart ID attribute */
	'data-chart-id'?: string;
}

export const ChartLayout = forwardRef< HTMLDivElement, ChartLayoutProps >(
	(
		{
			legendPosition,
			legendElement,
			legendChildren,
			children,
			trailingContent,
			isWaitingForMeasurement,
			gap,
			className,
			style,
			'data-testid': dataTestId,
			'data-chart-id': dataChartId,
		},
		ref
	) => {
		const visibilityStyle =
			isWaitingForMeasurement !== undefined
				? { visibility: ( isWaitingForMeasurement ? 'hidden' : 'visible' ) as const }
				: {};

		return (
			<Stack
				ref={ ref }
				direction="column"
				gap={ gap }
				className={ clsx( styles[ 'chart-layout' ], className ) }
				style={ { ...style, ...visibilityStyle } }
				data-testid={ dataTestId }
				data-chart-id={ dataChartId }
			>
				{ legendPosition === 'top' && legendElement }
				{ renderLegendSlot( legendChildren, 'top' ) }

				{ children }

				{ legendPosition === 'bottom' && legendElement }
				{ renderLegendSlot( legendChildren, 'bottom' ) }

				{ trailingContent }
			</Stack>
		);
	}
);

ChartLayout.displayName = 'ChartLayout';
```

Note: All existing charts import `Stack` from `@wordpress/ui`.

- [ ] **Step 5: Create the SCSS module**

```scss
// chart-layout.module.scss
// Intentionally minimal — ChartLayout is a structural wrapper.
// Chart-specific styles remain in each chart's own SCSS module.
.chart-layout {
	// Base styles if needed in future. Currently the Stack handles layout.
}
```

- [ ] **Step 6: Create the barrel export**

```ts
// index.ts
export { ChartLayout } from './chart-layout';
```

- [ ] **Step 7: Run the tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="chart-layout" --no-coverage`
Expected: All tests PASS

- [ ] **Step 8: Fix any test failures and iterate until green**

Adjust the implementation if needed. Stack comes from `@wordpress/ui`. Match the `gap` prop type to Stack's expected type (e.g., spacing scale union) rather than plain `string` for tighter typing.

- [ ] **Step 9: Commit**

```bash
git add projects/js-packages/charts/src/components/chart-layout/
git commit -m "Charts: Add ChartLayout component for shared chart+legend layout"
```

---

## Chunk 2: Migrate Line & Bar Charts

### Task 3: Refactor LineChart to use ChartLayout

**Files:**
- Modify: `src/charts/line-chart/line-chart.tsx:468-663` (the return block)

- [ ] **Step 10: Run existing LineChart tests to establish baseline**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="line-chart" --no-coverage`
Expected: All PASS

- [ ] **Step 11: Refactor LineChart return statement**

Replace the Stack wrapper in LineChart with ChartLayout. The refactored return should look like:

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartRef: internalChartRef, chartWidth: width, chartHeight } }>
		<ChartLayout
			legendPosition={ legendPosition }
			legendElement={ legendElement }
			legendChildren={ legendChildren }
			isWaitingForMeasurement={ isWaitingForMeasurement }
			gap={ gap }
			className={ clsx(
				'line-chart',
				styles[ 'line-chart' ],
				{ [ styles[ 'line-chart--animated' ] ]: animation && ! prefersReducedMotion },
				className
			) }
			style={ { width, height } }
			data-testid="line-chart"
			trailingContent={ nonLegendChildren }
		>
			<div
				className={ styles[ 'line-chart__svg-wrapper' ] }
				ref={ svgWrapperRef }
				role="grid"
				aria-label={ __( 'Line chart', 'jetpack-charts' ) }
				tabIndex={ 0 }
				onKeyDown={ onChartKeyDown }
				onFocus={ onChartFocus }
				onBlur={ onChartBlur }
			>
				{ ! isWaitingForMeasurement && (
					<div ref={ chartRef }>
						<XYChart { /* ... existing props ... */ }>
							{ /* ... existing chart internals unchanged ... */ }
						</XYChart>
					</div>
				) }
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

Key changes:
- Remove the outer `<Stack>` and replace with `<ChartLayout>`
- Remove the 4 legend lines (top/bottom legendElement + renderLegendSlot calls)
- Remove `{ nonLegendChildren }` from end — pass as `trailingContent`
- Remove `visibility` from `style` — handled by `isWaitingForMeasurement` prop
- Add `import { ChartLayout } from '../../../components/chart-layout'`
- Remove `import { Stack }` if no longer used elsewhere in the file
- Remove `import { renderLegendSlot }` if no longer used

- [ ] **Step 12: Run LineChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="line-chart" --no-coverage`
Expected: All PASS — behavior unchanged

- [ ] **Step 13: Commit**

```bash
git add projects/js-packages/charts/src/charts/line-chart/line-chart.tsx
git commit -m "Charts: Migrate LineChart to use ChartLayout"
```

---

### Task 4: Refactor BarChart to use ChartLayout

**Files:**
- Modify: `src/charts/bar-chart/bar-chart.tsx:341-489` (the return block)

- [ ] **Step 14: Run existing BarChart tests to establish baseline**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="bar-chart" --no-coverage`
Expected: All PASS

- [ ] **Step 15: Refactor BarChart return statement**

Same pattern as LineChart. Replace Stack with ChartLayout:

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartWidth: width, chartHeight } }>
		<ChartLayout
			legendPosition={ legendPosition }
			legendElement={ legendElement }
			legendChildren={ legendChildren }
			isWaitingForMeasurement={ isWaitingForMeasurement }
			gap={ gap }
			className={ clsx(
				'bar-chart',
				styles[ 'bar-chart' ],
				{
					[ styles[ `bar-chart--animated${ horizontal ? '-horizontal' : '' }` ] ]:
						animation && ! prefersReducedMotion,
				},
				className
			) }
			style={ { width, height } }
			data-testid="bar-chart"
			data-chart-id={ `bar-chart-${ chartId }` }
			trailingContent={ nonLegendChildren }
		>
			<div
				className={ styles[ 'bar-chart__svg-wrapper' ] }
				ref={ svgWrapperRef }
				role="grid"
				aria-label={ __( 'Bar chart', 'jetpack-charts' ) }
				tabIndex={ 0 }
				onKeyDown={ onChartKeyDown }
				onFocus={ onChartFocus }
				onBlur={ onChartBlur }
			>
				{ ! isWaitingForMeasurement && (
					<div ref={ chartRef }>
						<XYChart { /* ... existing ... */ }>
							{ /* ... unchanged ... */ }
						</XYChart>
					</div>
				) }
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

- [ ] **Step 16: Run BarChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="bar-chart" --no-coverage`
Expected: All PASS

- [ ] **Step 17: Commit**

```bash
git add projects/js-packages/charts/src/charts/bar-chart/bar-chart.tsx
git commit -m "Charts: Migrate BarChart to use ChartLayout"
```

---

## Chunk 3: Migrate Pie Charts & Leaderboard

### Task 5: Refactor PieChart to use ChartLayout

**Files:**
- Modify: `src/charts/pie-chart/pie-chart.tsx:327-500`

- [ ] **Step 18: Run existing PieChart tests to establish baseline**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="pie-chart\\.test" --no-coverage`
Expected: All PASS

- [ ] **Step 19: Refactor PieChart return statement**

PieChart differences from Line/Bar:
- Uses `containerRef` on the Stack (pass as `ref`)
- No `isWaitingForMeasurement` (omit the prop)
- Has tooltip portal + htmlChildren + otherChildren after bottom legend (combine into `trailingContent`)

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartWidth: width, chartHeight: height } }>
		<ChartLayout
			ref={ containerRef }
			legendPosition={ legendPosition }
			legendElement={ legendElement }
			legendChildren={ legendChildren }
			gap={ gap }
			className={ clsx(
				'pie-chart',
				styles[ 'pie-chart' ],
				{ [ styles[ 'pie-chart--responsive' ] ]: ! propWidth && ! propHeight },
				className
			) }
			style={ {
				width: propWidth || undefined,
				height: propHeight || undefined,
			} }
			trailingContent={
				<>
					{ withTooltips && tooltipOpen && tooltipData && (
						<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
							<div role="tooltip">{ renderTooltip( { tooltipData } ) }</div>
						</TooltipInPortal>
					) }
					{ htmlChildren }
					{ otherChildren }
				</>
			}
		>
			<div className={ styles[ 'pie-chart__svg-wrapper' ] } ref={ svgWrapperRef }>
				<svg { /* ... existing ... */ }>
					{ /* ... unchanged ... */ }
				</svg>
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

- [ ] **Step 20: Run PieChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="pie-chart\\.test" --no-coverage`
Expected: All PASS

- [ ] **Step 21: Commit**

```bash
git add projects/js-packages/charts/src/charts/pie-chart/pie-chart.tsx
git commit -m "Charts: Migrate PieChart to use ChartLayout"
```

---

### Task 6: Refactor PieSemiCircleChart to use ChartLayout

**Files:**
- Modify: `src/charts/pie-semi-circle-chart/pie-semi-circle-chart.tsx:359-499`

- [ ] **Step 22: Run existing PieSemiCircleChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="pie-semi-circle" --no-coverage`
Expected: All PASS

- [ ] **Step 23: Refactor PieSemiCircleChart return statement**

Same approach as PieChart — uses `containerRef`, no `isWaitingForMeasurement`, trailing tooltip/html/other content.

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartWidth: width, chartHeight: height } }>
		<ChartLayout
			ref={ containerRef }
			legendPosition={ legendPosition }
			legendElement={ legendElement }
			legendChildren={ legendChildren }
			gap={ gap }
			className={ clsx(
				'pie-semi-circle-chart',
				styles[ 'pie-semi-circle-chart' ],
				{ [ styles[ 'pie-semi-circle-chart--responsive' ] ]: ! propWidth && ! propHeight },
				className
			) }
			style={ {
				width: propWidth || undefined,
				height: propHeight || undefined,
			} }
			data-testid="pie-chart-container"
			trailingContent={
				<>
					{ withTooltips && tooltipOpen && tooltipData && (
						<TooltipInPortal top={ tooltipTop || 0 } left={ tooltipLeft || 0 }>
							<div role="tooltip">{ renderTooltip( { tooltipData } ) }</div>
						</TooltipInPortal>
					) }
					{ htmlChildren }
					{ otherChildren }
				</>
			}
		>
			<div ref={ svgWrapperRef } className={ styles[ 'pie-semi-circle-chart__svg-wrapper' ] }>
				<svg { /* ... existing ... */ }>
					{ /* ... unchanged ... */ }
				</svg>
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

- [ ] **Step 24: Run PieSemiCircleChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="pie-semi-circle" --no-coverage`
Expected: All PASS

- [ ] **Step 25: Commit**

```bash
git add projects/js-packages/charts/src/charts/pie-semi-circle-chart/pie-semi-circle-chart.tsx
git commit -m "Charts: Migrate PieSemiCircleChart to use ChartLayout"
```

---

### Task 7: Refactor LeaderboardChart to use ChartLayout

**Files:**
- Modify: `src/charts/leaderboard-chart/leaderboard-chart.tsx:299-383`

- [ ] **Step 26: Run existing LeaderboardChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="leaderboard" --no-coverage`
Expected: All PASS

- [ ] **Step 27: Refactor LeaderboardChart return statement**

LeaderboardChart differences:
- No `isWaitingForMeasurement`
- No ref on the Stack
- Has `style` spread (`...style`)
- Uses `data-testid="leaderboard-chart-container"`

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartWidth: 0, chartHeight: 0 } }>
		<ChartLayout
			legendPosition={ legendPosition }
			legendElement={ legendElement }
			legendChildren={ legendChildren }
			className={ clsx(
				styles.leaderboardChart,
				{
					[ styles[ 'leaderboardChart--responsive' ] ]: ! propWidth && ! propHeight,
					[ styles[ 'leaderboardChart--loading' ] ]: loading,
				},
				className
			) }
			gap={ gap }
			style={ {
				...style,
				width: propWidth || undefined,
				height: propHeight || undefined,
			} }
			data-testid="leaderboard-chart-container"
			trailingContent={ nonLegendChildren }
		>
			<div className={ styles.leaderboardChart__content }>
				{ /* ... existing Grid content unchanged ... */ }
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

Also refactor the **empty state** return (around line 260-280) to use ChartLayout for consistency:

```tsx
return (
	<SingleChartContext.Provider value={ { chartId, chartWidth: 0, chartHeight: 0 } }>
		<ChartLayout
			legendPosition={ legendPosition }
			legendElement={ false }
			legendChildren={ legendChildren }
			className={ clsx( styles.leaderboardChart, className ) }
			gap={ gap }
			style={ { ...style, width: propWidth || undefined, height: propHeight || undefined } }
			data-testid="leaderboard-chart-container"
			trailingContent={ nonLegendChildren }
		>
			<div className={ styles.emptyState }>
				{ loading
					? __( 'Loading\u2026', 'jetpack-charts' )
					: __( 'No data available', 'jetpack-charts' ) }
			</div>
		</ChartLayout>
	</SingleChartContext.Provider>
);
```

- [ ] **Step 28: Run LeaderboardChart tests**

Run: `cd projects/js-packages/charts && pnpm test -- --testPathPattern="leaderboard" --no-coverage`
Expected: All PASS

- [ ] **Step 29: Commit**

```bash
git add projects/js-packages/charts/src/charts/leaderboard-chart/leaderboard-chart.tsx
git commit -m "Charts: Migrate LeaderboardChart to use ChartLayout"
```

---

## Chunk 4: Final Verification

### Task 8: Run full test suite & Storybook verification

- [ ] **Step 30: Run full charts test suite**

Run: `cd projects/js-packages/charts && pnpm test --no-coverage`
Expected: All tests PASS

- [ ] **Step 31: Type check**

Run: `cd projects/js-packages/charts && pnpm run build`
Expected: No type errors

- [ ] **Step 32: Verify Storybook renders**

Manually check in Storybook that all 5 chart types render correctly with legends at both positions. Check:
- LineChart with legend top/bottom
- BarChart with legend top/bottom
- PieChart with legend top/bottom
- PieSemiCircleChart with legend top/bottom
- LeaderboardChart with legend top/bottom

- [ ] **Step 33: Clean up unused imports**

In each migrated chart file, remove any now-unused imports:
- `Stack` from `@wordpress/components` (if only used for the outer wrapper)
- `renderLegendSlot` from `chart-composition` (if only used in the removed pattern)

Run tests again after cleanup.

- [ ] **Step 34: Final commit**

```bash
git add -u projects/js-packages/charts/
git commit -m "Charts: Clean up unused imports after ChartLayout migration"
```

---

## Design Decisions

1. **ChartLayout does NOT create the legend element.** Each chart has slightly different legend defaults (shape: 'rect' vs 'circle', custom className, custom shapeStyles). Keeping legend creation in each chart avoids a complex config object and keeps ChartLayout focused on layout.

2. **`trailingContent` prop instead of multiple named slots.** Charts have varying needs after the bottom legend (nonLegendChildren, htmlChildren, tooltips). A single `trailingContent` ReactNode keeps the API simple — each chart composes what it needs.

3. **`isWaitingForMeasurement` is opt-in.** Only Line/Bar charts use visibility hiding for measurement. When `undefined`, no visibility style is applied (Pie/Leaderboard behavior).

4. **Legend slots use existing `renderLegendSlot` function.** No need to reinvent — ChartLayout calls it the same way each chart did. The composition-API legend children pattern added since the issue was created is fully supported.

5. **No SCSS for layout itself.** The Stack component handles flex direction/gap. ChartLayout's SCSS is a placeholder for future needs. Chart-specific styles remain in each chart's module.

6. **`containerRef` on ChartLayout is a known variance (Pie charts only).** PieChart and PieSemiCircleChart pass `containerRef` (from `useTooltipInPortal`) as the `ref` to ChartLayout, while Line/Bar/Leaderboard don't use a ref. Moving tooltip portal bounds measurement to the svg-wrapper div would eliminate this variance but requires merging two refs (`containerRef` + `svgWrapperRef`) and risks tooltip positioning regressions. Tracked as follow-up: [CHARTS-186](https://linear.app/a8c/issue/CHARTS-186/move-tooltip-portal-containerref-off-chartlayout-in-pie-charts).
