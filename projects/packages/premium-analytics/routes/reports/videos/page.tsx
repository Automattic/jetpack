/**
 * External dependencies
 */
import {
	normalizeReportParams,
	type StatsVideoPlaysItem,
	type StatsVideoPlaysComparisonItem,
} from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getVideosFields, useVideosReportRecords } from './config';

const ROUTE_FROM = route.path;

/**
 * Resolve a stable records-table identity for a video.
 *
 * @param video - The normalized video row.
 * @return The video's stable row key.
 */
function getVideoRowId( video: StatsVideoPlaysComparisonItem ): string {
	const id = video.id != null ? String( video.id ) : '';

	if ( id ) {
		return id;
	}

	if ( video.link ) {
		return video.link;
	}

	const label = typeof video.label === 'string' ? video.label.trim() : '';

	return label ? `video:${ label }` : 'video:unknown';
}

const RECORDS_VIEW = {
	sort: { field: 'plays', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			plays: { align: 'end' as const },
			impressions: { align: 'end' as const },
		},
	},
};

const sortVideoCsvRows = ( a: StatsVideoPlaysItem, b: StatsVideoPlaysItem ) => b.plays - a.plays;

/**
 * Premium Analytics Videos report page.
 *
 * @return The Videos report page.
 */
function VideosReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const records = useVideosReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getVideosFields( records.hasComparison ),
		[ records.hasComparison ]
	);
	const csvColumns = useMemo< CsvColumn< StatsVideoPlaysItem >[] >(
		() => [
			{
				label: __( 'Video ID', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.id ?? '',
			},
			{
				label: __( 'Video', 'jetpack-premium-analytics-pkg' ),
				getValue: row =>
					typeof row.label === 'string' && row.label
						? row.label
						: __( 'Untitled video', 'jetpack-premium-analytics-pkg' ),
			},
			{ label: __( 'Plays', 'jetpack-premium-analytics-pkg' ), getValue: row => row.plays },
			{
				label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.impressions,
			},
			{
				label: __( 'Watch time (hours)', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.watch_time,
			},
			{
				label: __( 'Retention rate (%)', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.retention_rate,
			},
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'videos',
		range: reportParams,
		status: records,
		sort: sortVideoCsvRows,
	} );
	const isTableLoading = records.isLoading || records.isFetching;

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
							to: dashboardLink,
						},
						{ label: __( 'Videos', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			subTitle={ __( 'See how your videos perform.', 'jetpack-premium-analytics-pkg' ) }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout filters={ <DateFiltersPanel { ...dateFilters } /> }>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load videos', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< StatsVideoPlaysComparisonItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getVideoRowId }
						isLoading={ isTableLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search videos', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Videos report page (default export for the report registry).
 *
 * @return The Videos report page.
 */
export default function VideosReportPage(): JSX.Element {
	return <VideosReport />;
}
