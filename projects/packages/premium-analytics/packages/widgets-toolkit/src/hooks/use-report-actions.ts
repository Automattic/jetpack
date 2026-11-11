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
import type { WidgetRelevance, WidgetRuntimeAction } from '@wordpress/widget-primitives';

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
	 * Action id. A second call with another id adds a link beside "View all". Defaults to `view-all`.
	 */
	id?: string;

	/**
	 * Report id in the reports registry, e.g. `posts`: the link opens `/reports/<report>`.
	 */
	report?: string;

	/**
	 * Report tab to open (`?section=`), resolved by the report's own resolver.
	 */
	section?: string;

	/**
	 * Link label. Defaults to "View all".
	 */
	label?: string;

	/**
	 * Where the host places the link. Defaults to `high`, the card footer's text action.
	 */
	relevance?: WidgetRelevance;

	/**
	 * The linked report's CSV download, offered once the widget's rows settle.
	 */
	csv?: ReportCsvActionOptions< TItem, TRow >;

	/**
	 * The widget's own actions, placed after the link and before the download.
	 */
	actions?: WidgetRuntimeAction[];
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
 * @param options           - The actions to declare.
 * @param options.id        - Action id of the link.
 * @param options.report    - Report the link opens; none for no link.
 * @param options.section   - Report tab the link opens.
 * @param options.label     - Link label.
 * @param options.relevance - Where the host places the link.
 * @param options.csv       - The CSV download; none for no download.
 * @param options.actions   - The widget's own actions.
 * @return Whether the host places the actions.
 */
export function useReportActions< TItem, TRow >( {
	id = 'view-all',
	report,
	section,
	label,
	relevance = 'high',
	csv,
	actions: widgetActions = [],
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
			id,
			label: label ?? __( 'View all', 'jetpack-premium-analytics-pkg' ),
			relevance,
			href: buildDashboardHref( `/reports/${ report }`, search ),
		} );
	}

	actions.push( ...widgetActions );

	if ( download ) {
		actions.push( { ...download, relevance: 'medium' } );
	}

	return useWidgetActions( actions );
}
