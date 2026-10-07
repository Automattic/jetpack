/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	PageNotice,
	describeError,
	ReportPageLayout,
	ReportPageShell,
	ExporterCsvAction,
	clicksCsvExporter,
	useReportRetry,
	type ClickRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getClicksFields, useClicksReportRecords } from './config';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the Clicks records table.
 *
 * @param item - The clicked URL row.
 * @return The row id.
 */
function getClickRowId( item: ClickRow ): string {
	return item.id;
}

/**
 * Resolve the click-group parent row id for nested URL rows.
 *
 * @param item - The clicked URL row.
 * @return The parent row id, if any.
 */
function getClickRowParentId( item: ClickRow ): string | undefined {
	return item.parentId;
}

/*
 * No default sort: the aggregated rows arrive pre-ordered by clicks (groups,
 * then each group's URLs), and the unsorted view preserves that order. Sorting
 * a field reorders rows within each hierarchy level.
 */
const RECORDS_VIEW = {
	layout: {
		styles: {
			clickedUrl: { width: '100%' },
			clicks: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Clicks report page component.
 *
 * @return The Clicks report page.
 */
function ClicksReport(): JSX.Element {
	const reportParams = useReportParams();

	const records = useClicksReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getClicksFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );

	const { getLabel } = REPORTS.clicks;

	let tableReplacement: JSX.Element | undefined;

	if ( records.isError ) {
		tableReplacement = (
			<PageNotice
				{ ...describeError( records.error, {
					retryDescription: __(
						"We couldn't load clicks. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					onRetry: retry,
				} ) }
			/>
		);
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ clicksCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				{ tableReplacement ?? (
					<ReportDrilldownTable< ClickRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getClickRowId }
						getItemParentId={ getClickRowParentId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search clicked URLs', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
						collapsible
						defaultExpanded="none"
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Clicks report page (default export for the report registry).
 *
 * @return The Clicks report page.
 */
export default function ClicksReportPage(): JSX.Element {
	return <ClicksReport />;
}
