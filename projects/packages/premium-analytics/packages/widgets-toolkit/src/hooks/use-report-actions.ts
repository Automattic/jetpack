/**
 * External dependencies
 */
import { buildDashboardHref } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { useWidgetActions } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import { useExporterCsvAction } from '../components/download-csv/csv-download-action';
import {
	eraseExporterRowTypes,
	reportCsvExporters,
	type ExportableReport,
} from '../report-exports/by-report';
import { useWidgetNavigationSearch } from './use-widget-navigation-search';
import type { ReportCsvExportStatus } from '../components/download-csv/use-report-csv-export';
import type { ReportCsvExporter } from '../report-exports/types';
import type { WidgetRuntimeAction } from '@wordpress/widget-primitives';

export type ReportCsvActionOptions< TItem, TRow > = {
	/**
	 * The linked report's exporter. A widget outside the dashboard package names the report instead.
	 */
	exporter?: ReportCsvExporter< TItem, TRow >;

	/**
	 * Id of the linked report, e.g. `videos`, for a widget that holds no exporter.
	 */
	report?: ExportableReport;

	/**
	 * The widget's request state for the active range; the error is the primary period's alone.
	 */
	status: ReportCsvExportStatus;

	/**
	 * How many rows the widget shows; an empty widget offers no download.
	 */
	rowCount: number;
};

export type ReportActionsOptions< TItem, TRow > = {
	/**
	 * Report id in the reports registry, e.g. `posts`: "View all" opens `/reports/<report>`.
	 */
	report?: string;

	/**
	 * Report tab to open (`?section=`), resolved by the report's own resolver.
	 */
	section?: string;

	/**
	 * The linked report's CSV download, offered once the widget's rows settle.
	 */
	csv?: ReportCsvActionOptions< TItem, TRow >;
};

const SETTLED_EMPTY: ReportCsvExportStatus = {
	isLoading: false,
	isFetching: false,
	isError: false,
};

/**
 * Declare a widget's report actions to its host: "View all", which opens the full report with
 * the shared dashboard date and comparison parameters, and the report's CSV download. The host
 * places them by relevance, the link as the card footer's text action and the download as its
 * compact one.
 *
 * @param options         - The actions to declare.
 * @param options.report  - Report the "View all" link opens; none for no link.
 * @param options.section - Report tab the link opens.
 * @param options.csv     - The CSV download; none for no download.
 * @return Whether the host places the actions.
 */
export function useReportActions< TItem, TRow >( {
	report,
	section,
	csv,
}: ReportActionsOptions< TItem, TRow > ): boolean {
	const search = useWidgetNavigationSearch( { section } );
	const download = useExporterCsvAction( {
		exporter: csv?.exporter
			? eraseExporterRowTypes( csv.exporter )
			: csv?.report && reportCsvExporters[ csv.report ],
		status: csv?.status ?? SETTLED_EMPTY,
		rowCount: csv?.rowCount ?? 0,
	} );

	const actions: WidgetRuntimeAction[] = [];

	if ( report ) {
		actions.push( {
			id: 'view-all',
			label: __( 'View all', 'jetpack-premium-analytics-pkg' ),
			relevance: 'high',
			href: buildDashboardHref( `/reports/${ report }`, search ),
		} );
	}

	if ( download ) {
		actions.push( { ...download, relevance: 'medium' } );
	}

	return useWidgetActions( actions );
}
