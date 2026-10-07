/**
 * External dependencies
 */
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ExporterCsvAction,
	PageNotice,
	describeError,
	ReportPageLayout,
	ReportPageShell,
	ReportRecordsTable,
	useReportRetry,
	emailsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getEmailsFields, useEmailsReportRecords } from './config';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

/**
 * Initial records-table view: newest emails first (matching the endpoint's
 * own sort), the title column absorbs spare width, and the numeric columns
 * stay compact and right-aligned.
 */
const RECORDS_VIEW = {
	sort: { field: 'date', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			opens: { align: 'end' as const },
			opens_rate: { align: 'end' as const },
			clicks: { align: 'end' as const },
			clicks_rate: { align: 'end' as const },
		},
	},
};

/**
 * Stable row id for the records table.
 *
 * @param item - The email summary row.
 * @return The row id.
 */
function getEmailRowId( item: StatsEmailSummaryItem ): string {
	return String( item.id ?? item.label );
}

/**
 * All-time summary capped at 30 rows, so only the breadcrumb header and records table
 * render — no date filters, tabs, or performance chart. Row titles link to the post
 * detail page's Email opens tab.
 *
 * @return The Emails report page.
 */
function EmailsReport(): JSX.Element {
	const records = useEmailsReportRecords();
	const reportParams = useReportParams();
	const fields = useMemo( () => getEmailsFields(), [] );
	const retry = useReportRetry( records.refetch );

	const { getLabel } = REPORTS.emails;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ emailsCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout title={ getLabel() }>
				{ records.isError ? (
					<PageNotice
						{ ...describeError( records.error, {
							retryDescription: __(
								"We couldn't load emails. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: retry,
						} ) }
					/>
				) : (
					<ReportRecordsTable< StatsEmailSummaryItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getEmailRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search emails', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Emails report page (default export for the report registry).
 *
 * @return The Emails report page.
 */
export default function EmailsReportPage(): JSX.Element {
	return <EmailsReport />;
}
