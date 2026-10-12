/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportPageLayout,
	ReportErrorState,
	ReportPageShell,
	ExporterCsvAction,
	referrersCsvExporter,
	type ReferrerRecord,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getReferrerFields, useMarkAsSpamAction, useReferrersReportRecords } from './config';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the Referrers records table.
 *
 * @param item - The referrer row.
 * @return The row id.
 */
function getReferrerRowId( item: ReferrerRecord ): string {
	return item.id;
}

/**
 * Resolve the parent row for nested referrers.
 *
 * @param item - The referrer row.
 * @return The parent row id, if present.
 */
function getReferrerParentId( item: ReferrerRecord ): string | undefined {
	return item.parentId;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	// Keep Referrer as the title field so DataViews renders native hierarchy
	// levels on the same nested group/source/domain structure as the widget.
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: {
			referrer: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Referrers report page component.
 *
 * @return {JSX.Element} The Referrers report page.
 */
function ReferrersReport(): JSX.Element {
	const reportParams = useReportParams();

	const { action: markAsSpamAction, spammedDomains } = useMarkAsSpamAction();
	const actions = useMemo( () => [ markAsSpamAction ], [ markAsSpamAction ] );
	const records = useReferrersReportRecords( reportParams, spammedDomains );
	const fields = useMemo( () => getReferrerFields(), [] );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.referrers;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ referrersCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load referrers. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<ReportDrilldownTable< ReferrerRecord >
						data={ records.rows }
						fields={ fields }
						getItemId={ getReferrerRowId }
						getItemParentId={ getReferrerParentId }
						actions={ actions }
						hideLevelMarkers
						collapsible
						defaultExpanded="none"
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search referrers', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ReportErrorState>
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Referrers report page (default export for the report registry).
 *
 * @return {JSX.Element} The Referrers report page.
 */
export default function ReferrersReportPage(): JSX.Element {
	return <ReferrersReport />;
}
