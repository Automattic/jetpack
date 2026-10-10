/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { siteChartFormatting } from '../../helpers';
import { useChartTheme } from '../../hooks';
import type { ReactNode } from 'react';

/** The charts context every Premium Analytics chart renders in: its theme and the site's formatting. */
export function ChartsProvider( { children }: { children: ReactNode } ) {
	const chartTheme = useChartTheme();

	return (
		<GlobalChartsProvider theme={ chartTheme } { ...siteChartFormatting() }>
			{ children }
		</GlobalChartsProvider>
	);
}
