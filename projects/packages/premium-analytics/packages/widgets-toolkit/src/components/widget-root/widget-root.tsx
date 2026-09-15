/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	useReportScope,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { siteChartFormatting } from '../../helpers';
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

/** Wraps a lazy-loaded widget with its query client, chart theme, and resolved report params. */
export function WidgetRoot( { attributes, children, setError }: WidgetRootProps ) {
	const chartTheme = useChartTheme();
	const navigationParams = useNormalizedReportParams( attributes );

	// Stripped after resolution, not at the source, so a no-comparison surface
	// never shows one regardless of URL/attributes; params stay in the URL for others.
	const { offersComparison } = useReportScope();
	const reportParams = useMemo(
		() => ( offersComparison ? navigationParams : withoutComparison( navigationParams ) ),
		[ navigationParams, offersComparison ]
	);

	const contextValue = useMemo(
		() => ( { reportParams, navigationParams, setError } ),
		[ reportParams, navigationParams, setError ]
	);

	return (
		<AnalyticsQueryClientProvider>
			<GlobalChartsProvider theme={ chartTheme } { ...siteChartFormatting() }>
				<WidgetRootContext.Provider value={ contextValue }>
					<div className={ styles.root }>{ children }</div>
				</WidgetRootContext.Provider>
			</GlobalChartsProvider>
		</AnalyticsQueryClientProvider>
	);
}
