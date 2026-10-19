/**
 * External dependencies
 */
import { useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ExporterCsvAction,
	ReportPageLayout,
	ReportErrorState,
	ReportPageShell,
	ReportPageTabs,
	ReportRecordsTable,
	commentsAuthorsCsvExporter,
	commentsPostsCsvExporter,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import {
	getCommentsFields,
	getCommentsReportTabs,
	getTabLabel,
	resolveTabId,
	useCommentsReportRecords,
	type CommentReportRow,
} from './config';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

const RECORDS_VIEW = {
	sort: { field: 'comments', direction: 'desc' as const },
	layout: {
		styles: {
			label: { width: '100%' },
			comments: { align: 'end' as const },
		},
	},
};

/**
 * Get the DataViews row id for a Comments report row.
 *
 * @param item - The Comments report row.
 * @return The row id.
 */
function getCommentRowId( item: CommentReportRow ): string {
	return item.id;
}

/**
 * Premium Analytics Comments report page.
 *
 * @return The Comments report page.
 */
function CommentsReport(): JSX.Element {
	const tabs = useMemo( () => getCommentsReportTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveTabId );
	const records = useCommentsReportRecords( activeTab );
	const reportParams = useReportParams();
	const fields = useMemo( () => getCommentsFields( activeTab ), [ activeTab ] );

	const { getLabel } = REPORTS.comments;

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ activeTab === 'posts' ? commentsPostsCsvExporter : commentsAuthorsCsvExporter }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout
				title={ getTabLabel( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
			>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load comments. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<ReportRecordsTable< CommentReportRow >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getCommentRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search comments', 'jetpack-premium-analytics-pkg' ) }
					/>
				</ReportErrorState>
			</ReportPageLayout>
		</ReportPageShell>
	);
}

/**
 * Comments report page (default export for the report registry).
 *
 * @return The Comments report page.
 */
export default function CommentsReportPage(): JSX.Element {
	return <CommentsReport />;
}
