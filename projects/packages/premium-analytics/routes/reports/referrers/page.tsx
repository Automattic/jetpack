/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DataViewsDrilldownNative, DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import { ReportPageLayout } from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { getReferrerFields, useReferrersReportRecords, type ReferrerRecord } from './config';
import styles from './page.module.css';

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
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const records = useReferrersReportRecords( reportParams );
	const fields = useMemo( () => getReferrerFields(), [] );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Stats', 'jetpack-premium-analytics' ),
							to: dashboardLink,
						},
						{ label: __( 'Referrers', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout
					filters={
						<div ref={ setContainerElement } className={ styles.dateFilters }>
							<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
						</div>
					}
				>
					<DataViewsDrilldownNative< ReferrerRecord >
						data={ records.rows }
						fields={ fields }
						getItemId={ getReferrerRowId }
						getItemParentId={ getReferrerParentId }
						hideLevelMarkers
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search referrers', 'jetpack-premium-analytics' ) }
					/>
				</ReportPageLayout>
			</div>
		</Page>
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
