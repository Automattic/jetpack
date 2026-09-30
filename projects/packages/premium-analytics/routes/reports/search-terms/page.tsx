/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportEmptyState,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	ExporterCsvAction,
	searchTermsCsvExporter,
	useReportRetry,
	type SearchTermRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getSearchTermsFields, useSearchTermsReportRecords } from './config';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

/**
 * Stable row id for the records table.
 *
 * @param item - The search-term row.
 * @return The row id.
 */
function getSearchTermRowId( item: SearchTermRow ): string {
	return item.id;
}

const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			term: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Premium Analytics Search terms report page.
 *
 * @return The report page.
 */
export default function SearchTermsReportPage(): JSX.Element {
	const reportParams = useReportParams();
	const records = useSearchTermsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getSearchTermsFields( records.table.hasComparison ),
		[ records.table.hasComparison ]
	);
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const tableIsLoading = records.table.isLoading || records.table.isFetching;

	const { getLabel } = REPORTS[ 'search-terms' ];

	let tableReplacement: JSX.Element | undefined;

	if ( records.isError ) {
		tableReplacement = (
			<ReportErrorState
				title={ __( 'Unable to load search terms', 'jetpack-premium-analytics-pkg' ) }
				onRetry={ retry }
			/>
		);
	} else if ( ! records.table.isLoading && records.table.rows.length === 0 ) {
		tableReplacement = <ReportEmptyState />;
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ searchTermsCsvExporter }
					items={ records.table.rows }
					status={ records.table }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				{ tableReplacement ?? (
					<ReportRecordsTable< SearchTermRow >
						data={ records.table.rows }
						fields={ fields }
						getItemId={ getSearchTermRowId }
						isLoading={ tableIsLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search terms', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}
