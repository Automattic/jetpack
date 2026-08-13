/**
 * External dependencies
 */
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportPageLayout,
	ReportRecordsTable,
	ReportCsvAction,
	useReportCsvExport,
	useReportRetry,
	type CsvColumn,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getTagRowId, getTagsFields, useTagsReportRecords } from './config';
import styles from './page.module.css';
import type { StatsTagsItem } from '@jetpack-premium-analytics/data';

/**
 * Initial records-table view: views sort descending, the label column absorbs
 * spare width, and the numeric column stays compact and right-aligned.
 */
const RECORDS_VIEW = {
	sort: { field: 'views', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

const sortTagCsvRows = ( a: StatsTagsItem, b: StatsTagsItem ) => b.value - a.value;

/**
 * Premium Analytics Tags & categories report page component.
 *
 * The `stats/tags` endpoint reports one flat all-time list and ignores
 * date-window parameters (verified against WPCOM; Calypso never sends date
 * params here either), so the page composes only the breadcrumb header and
 * records table: no date filters, tabs, or performance chart.
 *
 * @return The Tags & categories report page.
 */
function TagsReport(): JSX.Element {
	const records = useTagsReportRecords();
	const fields = useMemo( () => getTagsFields(), [] );
	const csvColumns = useMemo< CsvColumn< StatsTagsItem >[] >(
		() => [
			{
				label: __( 'Tag or category', 'jetpack-premium-analytics-pkg' ),
				getValue: row => row.labelText,
			},
			{ label: __( 'Views', 'jetpack-premium-analytics-pkg' ), getValue: row => row.value },
			{ label: __( 'URL', 'jetpack-premium-analytics-pkg' ), getValue: row => row.link ?? '' },
		],
		[]
	);
	const {
		canExport,
		rows: csvRows,
		filename: csvFilename,
	} = useReportCsvExport( {
		rows: records.rows,
		filenamePrefix: 'tags-and-categories',
		status: records,
		sort: sortTagCsvRows,
	} );
	const retry = useReportRetry( records.refetch );

	return (
		<Page
			visual={ <StatsPageIcon /> }
			breadcrumbs={
				<StatsBreadcrumbs
					items={ [ { label: __( 'Tags & categories', 'jetpack-premium-analytics-pkg' ) } ] }
				/>
			}
			subTitle={ __( 'Your most visited tags and categories.', 'jetpack-premium-analytics-pkg' ) }
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
							title={ __( 'Unable to load tags and categories', 'jetpack-premium-analytics-pkg' ) }
							onRetry={ retry }
						/>
					) : (
						<ReportRecordsTable< StatsTagsItem >
							data={ records.rows }
							fields={ fields }
							getItemId={ getTagRowId }
							isLoading={ records.isLoading }
							initialView={ RECORDS_VIEW }
							searchLabel={ __( 'Search tags and categories', 'jetpack-premium-analytics-pkg' ) }
						/>
					) }
				</ReportPageLayout>
			</div>
		</Page>
	);
}

/**
 * Tags & categories report page (default export for the report registry).
 *
 * @return The Tags & categories report page.
 */
export default function TagsReportPage(): JSX.Element {
	return <TagsReport />;
}
