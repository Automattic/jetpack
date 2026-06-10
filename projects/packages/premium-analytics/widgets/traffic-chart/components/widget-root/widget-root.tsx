/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@automattic/charts';
import { AnalyticsQueryClientProvider } from '@jetpack-premium-analytics/data';
import { type ReactNode } from 'react';
import '@automattic/charts/style.css';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../hooks';
import styles from './widget-root.module.scss';

type WidgetRootProps = {
	/**
	 * The children of the widget root.
	 */
	children: ReactNode;
};

/**
 * WidgetRoot
 *
 * Per-widget infrastructure wrapper providing the two contexts a lazy-loaded
 * dashboard widget needs: a React Query client and the charts theme provider.
 *
 * Unlike the upstream widgets-toolkit WidgetRoot it resolves no report params:
 * Jetpack Stats widgets are driven by stats period/quantity attributes (not
 * WooCommerce-Analytics report params), so those flow to the inner component
 * via props rather than through context.
 */
export function WidgetRoot( { children }: WidgetRootProps ) {
	const chartTheme = useChartTheme();

	return (
		<AnalyticsQueryClientProvider>
			<GlobalChartsProvider theme={ chartTheme }>
				<div className={ styles.root }>{ children }</div>
			</GlobalChartsProvider>
		</AnalyticsQueryClientProvider>
	);
}
