/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	useReportRetry,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getClicksFields, useClicksReportRecords, type ClickRow } from './config';

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
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const records = useClicksReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getClicksFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics-pkg' ),
							to: dashboardLink,
						},
						{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
		>
			<ReportPageLayout
				filters={
					<div ref={ setContainerElement }>
						<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
					</div>
				}
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load clicks', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportDrilldownTable< ClickRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getClickRowId }
						getItemParentId={ getClickRowParentId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search clicked URLs', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
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
