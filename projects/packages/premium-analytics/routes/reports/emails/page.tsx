/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getEmailsFields, useEmailsReportRecords } from './config';
import styles from './page.module.css';
import type { StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';

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

const sortEmailCsvRows = ( a: StatsEmailSummaryItem, b: StatsEmailSummaryItem ) =>
	String( b.date ?? '' ).localeCompare( String( a.date ?? '' ) );

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
 * Premium Analytics Emails report page component.
 *
 * The summary endpoint reports across the whole lifetime of the site and
 * caps its row count at 30, so the page composes only the breadcrumb header
 * and records table: no date filters, tabs, or performance chart. Each row's
 * title links into the post detail page's Email opens tab — the per-email
 * detail surface.
 *
 * @return The Emails report page.
 */
function EmailsReport(): JSX.Element {
	const records = useEmailsReportRecords();
	const fields = useMemo( () => getEmailsFields(), [] );
	const csvColumns = useMemo< CsvColumn< StatsEmailSummaryItem >[] >(
		() => [
			{
				label: __( 'Email', 'jetpack-premium-analytics-pkg' ),
				getValue: row => String( row.label ?? '' ),
			},
			{
				label: __( 'Sent', 'jetpack-premium-analytics-pkg' ),
				getValue: row => String( row.date ?? '' ),
			},
			{ label: __( 'Opens', 'jetpack-premium-analytics-pkg' ), getValue: row => row.opens },
			{
				label: __( 'Open rate', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.opens_rate,
			},
			{ label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ), getValue: row => row.clicks },
			{
				label: __( 'Click rate', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.clicks_rate,
			},
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'emails',
		status: records,
		sort: sortEmailCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	// Preserve the shared report window when returning to the dashboard.
	const dashboardLink = useDashboardLink();

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics-pkg' ), to: dashboardLink },
						{ label: __( 'Emails', 'jetpack-premium-analytics-pkg' ) },
					] }
				/>
			}
			subTitle={ __(
				'Open and click performance of your latest emails.',
				'jetpack-premium-analytics-pkg'
			) }
			actions={
				canExport ? (
					<ReportCsvAction columns={ csvColumns } rows={ csvRows } filename={ csvFilename } />
				) : undefined
			}
			className={ styles.page }
		>
			<div className={ styles.content }>
				<ReportPageLayout>
					{ /*
					 * The error state replaces the table rather than sitting beside it:
					 * `ReportRecordsTable`'s `empty` renders on row count, not fetch
					 * status, so a failed refetch over cached rows would otherwise leave
					 * stale data on screen with no notice and no way to retry.
					 */ }
					{ records.isError ? (
						<ReportErrorState
							title={ __( 'Unable to load emails', 'jetpack-premium-analytics-pkg' ) }
							onRetry={ retry }
						/>
					) : (
						<ReportRecordsTable< StatsEmailSummaryItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getEmailRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search emails', 'jetpack-premium-analytics-pkg' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
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
