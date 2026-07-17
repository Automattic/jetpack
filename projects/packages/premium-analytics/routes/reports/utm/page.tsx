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
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import {
	getReportUtmTabs,
	getUtmFields,
	resolveSection,
	useUtmReportRecords,
	type UtmReportRow,
} from './config';

const ROUTE_FROM = route.path;

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
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
	const { refetch } = records;
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );
	const fields = useMemo( () => getUtmFields( activeTab ), [ activeTab ] );
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const dashboardLink = useDashboardLink();
	const [ containerElement, setContainerElement ] = useState< HTMLDivElement | null >( null );

	return (
		<ReportPageShell
			tabbed
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'UTM', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
		>
			<ReportPageLayout
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				filters={
					<div ref={ setContainerElement }>
						<DateFiltersPanel { ...dateFilters } containerElement={ containerElement } />
					</div>
				}
			>
				{ records.isError ? (
					<ReportErrorState
						title={ __( 'Unable to load UTM data', 'jetpack-premium-analytics' ) }
						onRetry={ retry }
					/>
				) : (
					<ReportRecordsTable< UtmReportRow >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getUtmRowId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search UTM values', 'jetpack-premium-analytics' ) }
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
