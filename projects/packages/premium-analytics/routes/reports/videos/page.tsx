/**
 * External dependencies
 */
import { type StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	ExporterCsvAction,
	videosCsvExporter,
	useReportRetry,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type JSX } from 'react';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
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
	titleField: 'label',
	mediaField: 'poster',
	layout: {
		aspectRatio: '16/9' as const,
		styles: {
			plays: { align: 'end' as const },
			impressions: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Videos report page.
 *
 * @return The Videos report page.
 */
function VideosReport(): JSX.Element {
	const reportParams = useReportParams();
	const records = useVideosReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getVideosFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.videos;

	let tableReplacement: JSX.Element | undefined;

	if ( records.isError ) {
		tableReplacement = (
			<ReportErrorState
				title={ __( 'Unable to load videos', 'jetpack-premium-analytics-pkg' ) }
				onRetry={ retry }
			/>
		);
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ videosCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				{ tableReplacement ?? (
					<ReportRecordsTable< StatsVideoPlaysComparisonItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getVideoRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
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
