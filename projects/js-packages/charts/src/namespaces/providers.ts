/**
 * Provider exports with namespaced types.
 */

import {
	GlobalChartsProvider as GlobalChartsProviderComponent,
	useGlobalChartsContext,
	useGlobalChartsTheme,
	GlobalChartsContext,
	defaultTheme,
} from '../providers';
import type {
	GlobalChartsContextValue,
	ChartRegistration,
	GetElementStylesParams,
	ElementStyles,
} from '../providers/chart-context';

// ============================================================================
// GlobalChartsProvider
// ============================================================================

export const GlobalChartsProvider = Object.assign( GlobalChartsProviderComponent, {
	Context: GlobalChartsContext,
	defaultTheme,
	useContext: useGlobalChartsContext,
	useTheme: useGlobalChartsTheme,
} );

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GlobalChartsProvider {
	export type ContextValue = GlobalChartsContextValue;
	export type Registration = ChartRegistration;
	export type GetStylesParams = GetElementStylesParams;
	export type Styles = ElementStyles;
}

// Alias for backward compatibility
export const ThemeProvider = GlobalChartsProvider;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ThemeProvider {
	export type ContextValue = GlobalChartsContextValue;
	export type Registration = ChartRegistration;
	export type GetStylesParams = GetElementStylesParams;
	export type Styles = ElementStyles;
}
