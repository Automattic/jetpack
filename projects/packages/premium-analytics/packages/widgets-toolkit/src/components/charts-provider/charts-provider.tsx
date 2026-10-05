/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import { siteChartFormatting } from '../../helpers';
import { useChartTheme } from '../../hooks';
import styles from './charts-provider.module.scss';
import type { ReactNode } from 'react';

/** The charts context every Premium Analytics chart renders in: its theme, the site's formatting, and light tooltips. */
export function ChartsProvider( { children }: { children: ReactNode } ) {
	const chartTheme = useChartTheme();

	return (
		<div className={ styles.root }>
			<GlobalChartsProvider theme={ chartTheme } { ...siteChartFormatting() }>
				{ children }
			</GlobalChartsProvider>
		</div>
	);
}
