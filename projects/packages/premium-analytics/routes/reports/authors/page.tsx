/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import { useDashboardLink, useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ReportCsvAction,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
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
import { getAuthorName, getAuthorsFields, useAuthorsReportRecords, type AuthorRow } from './config';

const ROUTE_FROM = route.path;

/**
 * Return the stable id generated while aggregating an author or post row.
 *
 * @param item - The aggregate author row.
 * @return The row id.
 */
function getAuthorRowId( item: AuthorRow ): string {
	return item.id;
}

/**
 * Resolve the author parent row id for nested post rows.
 *
 * @param item - The author or post row.
 * @return The parent author row id, if any.
 */
function getAuthorRowParentId( item: AuthorRow ): string | undefined {
	return item.parentId;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			author: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Keep nested posts identifiable after the table hierarchy is flattened into CSV rows.
 *
 * @param item - The author or nested post row.
 * @return The author name or author-qualified post title.
 */
function getAuthorCsvLabel( item: AuthorRow ): string {
	return item.parentName
		? `${ getAuthorName( item.parentName ) } > ${ item.label }`
		: getAuthorName( item.label );
}

/**
 * Premium Analytics Authors report page component.
 *
 * @return The Authors report page.
 */
function AuthorsReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);

	const records = useAuthorsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getAuthorsFields( records.hasComparison ),
		[ records.hasComparison ]
	);
	const csvColumns = useMemo< CsvColumn< AuthorRow >[] >(
		() => [
			{
				label: __( 'Author / post', 'jetpack-premium-analytics-pkg' ),
				getValue: getAuthorCsvLabel,
			},
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'top-authors',
		range: reportParams,
		status: records,
	} );

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();

	return (
		<ReportPageShell
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'Top authors', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout filters={ <DateFiltersPanel { ...dateFilters } /> }>
				{ /*
				 * Replace the row-count-based table state when either request fails,
				 * so cached rows are not shown as current and an initial failure does
				 * not look like a legitimate empty report.
				 */ }
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load authors', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportDrilldownTable< AuthorRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getAuthorRowId }
						getItemParentId={ getAuthorRowParentId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search authors', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Authors report page (default export for the report registry).
 *
 * @return The Authors report page.
 */
export default function AuthorsReportPage(): JSX.Element {
	return <AuthorsReport />;
}
