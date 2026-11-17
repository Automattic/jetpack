/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportPageActions,
	ReportPageLayout,
	ReportErrorState,
	ExporterCsvAction,
	clicksCsvExporter,
	type ClickRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import reportPageStyles from '../page.module.scss';
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
	const fields = useMemo(
		() => getClicksFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );

	const { getLabel } = REPORTS.clicks;

	return (
		<Page
			className={ reportPageStyles.page }
			visual={ <Icon icon={ jetpack } /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ReportPageActions>
					<ExporterCsvAction
						exporter={ clicksCsvExporter }
						items={ records.rows }
						status={ records }
						reportParams={ reportParams }
					/>
				</ReportPageActions>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters } withAllTime>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load clicks. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
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
				</ReportErrorState>
			</ReportPageLayout>
		</Page>
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
