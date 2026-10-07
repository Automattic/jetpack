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
	tagsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import { getTagRowId, getTagsFields, useTagsReportRecords } from './config';
import type { StatsTagsItem } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

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

/**
 * Premium Analytics Tags & categories report page component.
 *
 * `stats/tags` returns one flat list over the seven days ending yesterday and ignores
 * date-window params, so this page has no date filters, tabs, or performance chart —
 * just the header and records table.
 *
 * @return The Tags & categories report page.
 */
function TagsReport(): JSX.Element {
	const records = useTagsReportRecords();
	const reportParams = useReportParams();
	const fields = useMemo( () => getTagsFields(), [] );
	const retry = useReportRetry( records.refetch );

	const { getLabel } = REPORTS.tags;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ tagsCsvExporter }
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
								"We couldn't load tags and categories. Please try again in a moment.",
								'jetpack-premium-analytics-pkg'
							),
							onRetry: retry,
						} ) }
					/>
				) : (
					<ReportRecordsTable< StatsTagsItem >
						data={ records.rows }
						fields={ fields }
						getItemId={ getTagRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search tags and categories', 'jetpack-premium-analytics-pkg' ) }
					/>
				) }
			</ReportPageLayout>
		</ReportPageShell>
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
