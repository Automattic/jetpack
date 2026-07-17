/**
 * External dependencies
 */
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import {
	ReportPageLayout,
	ReportPageSection,
	ReportRecordsTable,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
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
	const { refetch } = records;
	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	// Preserve the shared report window when returning to the dashboard.
	const dashboardLink = useDashboardLink();

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						{ label: __( 'Emails', 'jetpack-premium-analytics' ) },
					] }
				/>
			}
			subTitle={ __(
				'Open and click performance of your latest emails.',
				'jetpack-premium-analytics'
			) }
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
						<ReportPageSection>
							<EmptyState.Root>
								<EmptyState.Title>
									{ __( 'Unable to load emails', 'jetpack-premium-analytics' ) }
								</EmptyState.Title>
								<EmptyState.Description>
									{ __(
										"We couldn't load this data. Please try again in a moment.",
										'jetpack-premium-analytics'
									) }
								</EmptyState.Description>
								<EmptyState.Actions>
									<Button onClick={ retry }>{ __( 'Retry', 'jetpack-premium-analytics' ) }</Button>
								</EmptyState.Actions>
							</EmptyState.Root>
						</ReportPageSection>
					) : (
						<ReportRecordsTable< StatsEmailSummaryItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getEmailRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search emails', 'jetpack-premium-analytics' ) }
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
