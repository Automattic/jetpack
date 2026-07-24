/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@automattic/charts';
import {
	AnalyticsQueryClientProvider,
	getDefaultPreset,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { useSearch } from '@wordpress/route';
import { useMemo, type ReactNode } from 'react';
import { getStoreInfo } from '../../helpers/store-info';
import '@automattic/charts/style.css';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../hooks';
import { WidgetRootContext } from './context';
import styles from './widget-root.module.scss';
import type { ReportParamsFieldAttributes } from '../../fields';
import type { WidgetErrorConfig } from '../../types';

type WidgetRootProps = {
	/**
	 * The attributes for the widget.
	 */
	attributes?: Partial< ReportParamsFieldAttributes >;

	/**
	 * The children of the widget root.
	 */
	children: ReactNode;

	/**
	 * Function to report an error state in the widget.
	 * Passed from the dashboard's WidgetRenderProps.
	 */
	setError?: ( error: WidgetErrorConfig | true | null ) => void;

	/**
	 * The options for the widget root.
	 */
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
 * Hook that resolves widget attributes:
 * - `reportParams`: with URL search params when it's not provided
 */
function useResolveReportParams( attributes?: Partial< ReportParamsFieldAttributes > ) {
	let search: Record< string, unknown > = {};

	/*
	 * Read the search params of the current route. `{ strict: false }` returns
	 * whatever route is matched, so widgets pick up the date range (and the
	 * single-resource scope like `post_id`) on any page — not only the dashboard
	 * at `/`. `useSearch` throws when rendered outside a matched route (e.g.
	 * Storybook), so the empty fallback stands in there.
	 */
	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks -- useSearch may throw outside a matched route
		search = useSearch( { strict: false } );
	} catch {
		// Do nothing
	}

	/*
	 * Check if reportParams exists and is not empty.
	 * If it exists, use the provided reportParams.
	 * Otherwise, use URL search params as reportParams.
	 */
	const hasReportParams =
		!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;

	return hasReportParams ? attributes.reportParams : search;
}

/**
 * WidgetRoot
 *
 * A wrapper component that encapsulates all the infrastructure a lazy-loaded
 * dashboard widget needs:
 * - AnalyticsQueryClientProvider for data fetching
 * - GlobalChartsProvider with chart theme
 * - Report params resolution (from attributes or URL fallback)
 * - Context provider for child widgets to access resolved params
 *
 * @example
 * ```tsx
 * // In dashboard-widgets/my-widget/render.tsx
 * <WidgetRoot attributes={ attributes }>
 *     <MyWidget />
 * </WidgetRoot>
 *
 * // In widgets-toolkit/widgets/my-widget.tsx
 * function MyWidget() {
 *     const { reportParams } = useWidgetRootContext();
 *     // Use reportParams for data fetching
 * }
 * ```
 */
export function WidgetRoot( { attributes, children, setError }: WidgetRootProps ) {
	const chartTheme = useChartTheme();
	const rawReportParams = useResolveReportParams( attributes );

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	const reportParams = useMemo(
		() => normalizeReportParams( rawReportParams, defaultPreset ),
		[ rawReportParams, defaultPreset ]
	);

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
