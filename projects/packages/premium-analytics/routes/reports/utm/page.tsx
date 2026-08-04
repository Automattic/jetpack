/**
 * External dependencies
 */
import { normalizeReportParams } from '@jetpack-premium-analytics/data';
import {
	useDashboardLink,
	useReportDateFilters,
	useSectionTab,
} from '@jetpack-premium-analytics/routing';
import { DateFiltersPanel } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportDrilldownTable,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
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
import {
	getReportUtmTabs,
	getUtmFields,
	getUtmTabLabel,
	resolveSection,
	useUtmReportRecords,
	type UtmReportRow,
} from './config';

const ROUTE_FROM = route.path;

/*
 * No default sort: rows arrive as UTM parents followed by their posts. The
 * unsorted view preserves that hierarchy; user sorting stays within levels.
 */
const RECORDS_VIEW = {
	layout: {
		styles: {
			utmValue: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Stable row id for the UTM records table.
 *
 * @param item - The UTM row.
 * @return The row id.
 */
function getUtmRowId( item: UtmReportRow ): string {
	return item.id;
}

/**
 * Resolve the UTM parent row id for nested post rows.
 *
 * @param item - The UTM or post row.
 * @return The parent row id, if any.
 */
function getUtmRowParentId( item: UtmReportRow ): string | undefined {
	return item.parentId;
}

/**
 * Keep nested posts identifiable after the UTM hierarchy is flattened into CSV rows.
 *
 * @param item - The UTM parent or nested post row.
 * @return The UTM value or UTM-qualified post title.
 */
function getUtmCsvLabel( item: UtmReportRow ): string {
	return item.groupLabel ? `${ item.groupLabel } > ${ item.label }` : item.label;
}

/**
 * Premium Analytics UTM report page.
 *
 * @return The UTM report page.
 */
function UtmReport(): JSX.Element {
	const search = useSearch( { from: ROUTE_FROM } ) as Record< string, string | undefined >;
	const reportParams = useMemo(
		() => normalizeReportParams( search as Parameters< typeof normalizeReportParams >[ 0 ] ),
		[ search ]
	);
	const tabs = useMemo( () => getReportUtmTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	const records = useUtmReportRecords( activeTab, reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo( () => getUtmFields( activeTab ), [ activeTab ] );
	const csvColumns = useMemo< CsvColumn< UtmReportRow >[] >(
		() => [
			{ label: getUtmTabLabel( activeTab ), getValue: getUtmCsvLabel },
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.views },
		],
		[ activeTab ]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: `utm-${ activeTab }`,
		range: reportParams,
		status: records,
	} );
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();

	return (
		<ReportPageShell
			tabbed
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'UTM', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
		>
			<ReportPageLayout
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				filters={ <DateFiltersPanel { ...dateFilters } /> }
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load UTM data', 'jetpack-premium-analytics-pkg' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportDrilldownTable< UtmReportRow >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getUtmRowId }
						getItemParentId={ getUtmRowParentId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search UTM values', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Default export for the dynamic report registry.
 *
 * @return The UTM report page.
 */
export default function UtmReportPage(): JSX.Element {
	return <UtmReport />;
}
