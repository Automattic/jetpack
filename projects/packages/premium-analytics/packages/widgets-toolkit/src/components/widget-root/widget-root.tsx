/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider } from '@jetpack-premium-analytics/data';
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../hooks';
import { useNormalizedReportParams } from '../../hooks/use-normalized-report-params';
import { WidgetRootContext } from './context';
import styles from './widget-root.module.scss';
import type { ReportParamsFieldAttributes } from '../../fields';
import type { WidgetErrorConfig } from '../../types';

type WidgetRootProps = {
	attributes?: Partial< ReportParamsFieldAttributes >;

	children: ReactNode;

	/**
	 * Function to report an error state in the widget.
	 * Passed from the dashboard's WidgetRenderProps.
	 */
	setError?: ( error: WidgetErrorConfig | true | null ) => void;

	options?: {
		/**
		 * Deprecated. Report params are now always read from the current matched
		 * route, so this no longer affects resolution. Retained for backward
		 * compatibility with widgets that still pass it.
		 */
		from?: string;
	};
};

/**
 * WidgetRoot
 *
 * A wrapper component that encapsulates all the infrastructure a lazy-loaded
 * dashboard widget needs:
 * - AnalyticsQueryClientProvider for data fetching
 * - GlobalChartsProvider with chart theme
 * - Report params resolution (from attributes or URL fallback)
 * - Context provider for child widgets to access resolved params
 */
export function WidgetRoot( { attributes, children, setError }: WidgetRootProps ) {
	const chartTheme = useChartTheme();
	const reportParams = useNormalizedReportParams( attributes );

	const contextValue = useMemo( () => ( { reportParams, setError } ), [ reportParams, setError ] );

	return (
		<AnalyticsQueryClientProvider>
			<GlobalChartsProvider theme={ chartTheme }>
				<WidgetRootContext.Provider value={ contextValue }>
					<div className={ styles.root }>{ children }</div>
				</WidgetRootContext.Provider>
			</GlobalChartsProvider>
		</AnalyticsQueryClientProvider>
	);
}
