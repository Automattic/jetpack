/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	getDefaultPreset,
	normalizeReportParams,
	useReportScope,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { useSearch } from '@wordpress/route';
import { useMemo, type ReactNode } from 'react';
import { getStoreInfo } from '../../helpers/store-info';
/**
 * Internal dependencies
 */
import { useChartTheme } from '../../hooks';
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
 */
export function WidgetRoot( { attributes, children, setError }: WidgetRootProps ) {
	const chartTheme = useChartTheme();
	const rawReportParams = useResolveReportParams( attributes );

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	/*
	 * Stripped after resolution rather than at either source, so a surface that
	 * offers no comparison holds the invariant by construction: neither the URL
	 * nor a widget's own attributes can put a comparison in front of a reader
	 * who has no control to switch it off. The params stay in the URL, for the
	 * surfaces that do offer one to pick back up.
	 */
	const { offersComparison } = useReportScope();
	const navigationParams = useMemo(
		() => normalizeReportParams( rawReportParams, defaultPreset ),
		[ rawReportParams, defaultPreset ]
	);
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
			<GlobalChartsProvider theme={ chartTheme }>
				<WidgetRootContext.Provider value={ contextValue }>
					<div className={ styles.root }>{ children }</div>
				</WidgetRootContext.Provider>
			</GlobalChartsProvider>
		</AnalyticsQueryClientProvider>
	);
}
