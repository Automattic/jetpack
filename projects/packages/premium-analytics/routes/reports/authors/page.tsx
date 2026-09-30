/**
 * External dependencies
 */
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ExporterCsvAction,
	ReportEmptyState,
	ReportErrorState,
	ReportPageLayout,
	ReportPageShell,
	authorsCsvExporter,
	useReportRetry,
	type AuthorRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getAuthorsFields, useAuthorsReportRecords } from './config';
import type { JSX } from 'react';

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
 * Premium Analytics Authors report page component.
 *
 * @return The Authors report page.
 */
function AuthorsReport(): JSX.Element {
	const reportParams = useReportParams();

	const records = useAuthorsReportRecords( reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo(
		() => getAuthorsFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.authors;

	let tableReplacement: JSX.Element | undefined;

	/*
	 * Replace the row-count-based table state when either request fails,
	 * so cached rows are not shown as current and an initial failure does
	 * not look like a legitimate empty report.
	 */
	if ( records.isError ) {
		tableReplacement = (
			<ReportErrorState
				title={ __( 'Unable to load authors', 'jetpack-premium-analytics-pkg' ) }
				onRetry={ retry }
			/>
		);
	} else if ( ! records.isLoading && records.rows.length === 0 ) {
		tableReplacement = <ReportEmptyState />;
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ authorsCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters }>
				{ tableReplacement ?? (
					<ReportDrilldownTable< AuthorRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getAuthorRowId }
						getItemParentId={ getAuthorRowParentId }
						isLoading={ records.isLoading }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search authors', 'jetpack-premium-analytics-pkg' ) }
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
 * Authors report page (default export for the report registry).
 *
 * @return The Authors report page.
 */
export default function AuthorsReportPage(): JSX.Element {
	return <AuthorsReport />;
}
