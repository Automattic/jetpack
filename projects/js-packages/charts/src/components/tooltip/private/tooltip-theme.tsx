import { ThemeProvider } from '@wordpress/theme';
import { useMemo } from 'react';
import { useChartScopeElement } from '../../../providers/chart-scope';
import { resolveCssVariable } from '../../../utils/resolve-css-var';
import type { ReactNode } from 'react';

const TOOLTIP_SURFACE = 'var(--a8c-charts-color-tooltip-surface, #1e1e1e)';

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
		() => ( { background: resolveCssVariable( TOOLTIP_SURFACE, scopeElement ) || '#1e1e1e' } ),
		[ scopeElement ]
	);

	return <ThemeProvider color={ color }>{ children }</ThemeProvider>;
};
