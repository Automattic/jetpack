/**
 * External dependencies
 */
import {
	AnalyticsQueryClientProvider,
	getDefaultPreset,
	getStoreInfo,
	normalizeReportParams,
	useReportScope,
	withoutComparison,
} from '@jetpack-premium-analytics/data';
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { useSearch } from '@wordpress/route';
import { useMemo, type ReactNode } from 'react';
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

	// `{ strict: false }` lets widgets read params on any matched route, not
	// only `/`; `useSearch` throws outside one (e.g. Storybook), hence the catch.
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

/** Wraps a lazy-loaded widget with its query client, chart theme, and resolved report params. */
export function WidgetRoot( { attributes, children, setError }: WidgetRootProps ) {
	const chartTheme = useChartTheme();
	const rawReportParams = useResolveReportParams( attributes );

	const { launchedDate } = getStoreInfo();
	const defaultPreset = getDefaultPreset( launchedDate );

	// Stripped after resolution, not at the source, so a no-comparison surface
	// never shows one regardless of URL/attributes; params stay in the URL for others.
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
