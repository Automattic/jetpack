/**
 * Theme namespace - theme types and configuration.
 *
 * @example
 * ```tsx
 * import { Theme } from '@automattic/charts';
 *
 * const customTheme: Theme.Chart = {
 *   colors: ['#ff0000', '#00ff00'],
 *   backgroundColor: '#ffffff',
 *   // ...
 * };
 * ```
 */

import type {
	GlobalChartsContextValue,
	GetElementStylesParams,
	ElementStyles,
	ChartRegistration,
} from '../providers/chart-context';
import type { ChartTheme, CompleteChartTheme, AnnotationStyles } from '../types';

// Theme is a namespace-only export (types only)
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Theme {
	// Theme configuration types
	export type Chart = ChartTheme;
	export type ChartComplete = CompleteChartTheme;

	// Context types
	export type ContextValue = GlobalChartsContextValue;
	export type Registration = ChartRegistration;
	export type GetStylesParams = GetElementStylesParams;
	export type Styles = ElementStyles;

	// Annotation styles
	export type Annotation = AnnotationStyles;
}

// For runtime, export an empty object so `import { Theme }` works
export const Theme = {} as typeof Theme;
