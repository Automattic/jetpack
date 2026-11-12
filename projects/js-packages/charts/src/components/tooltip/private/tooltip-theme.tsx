import { color as d3Color } from '@visx/vendor/d3-color';
import { ThemeProvider } from '@wordpress/theme';
import { useMemo } from 'react';
import { useChartScopeElement } from '../../../providers/chart-scope';
import { resolveCssVariable } from '../../../utils/resolve-css-var';
import type { ReactNode } from 'react';

const DEFAULT_SURFACE = '#1e1e1e';
const TOOLTIP_SURFACE = `var(--a8c-charts-color-tooltip-surface, ${ DEFAULT_SURFACE })`;

// `ThemeProvider` throws on a seed that is not an opaque sRGB color, which would unmount the chart.
const toSeed = ( value: string | null ) => {
	const parsed = value ? d3Color( value ) : null;
	return parsed && parsed.opacity === 1 ? parsed.formatHex() : DEFAULT_SURFACE;
};

/**
 * Themes the tooltip box for its dark surface, as `@wordpress/ui`'s Tooltip themes its popup. The box re-declares the catalog under this theme, so every role it reads is tuned for the surface, whatever theme the chart is in.
 *
 * @param props          - Component props.
 * @param props.children - The tooltip box.
 * @return The themed box.
 */
export const TooltipTheme = ( { children }: { children: ReactNode } ) => {
	const scopeElement = useChartScopeElement();
	const color = useMemo(
		() => ( { background: toSeed( resolveCssVariable( TOOLTIP_SURFACE, scopeElement ) ) } ),
		[ scopeElement ]
	);

	// Core's `wp-theme` in WordPress 7.0 exports only `privateApis`.
	if ( ! ThemeProvider ) {
		return <>{ children }</>;
	}

	return <ThemeProvider color={ color }>{ children }</ThemeProvider>;
};
