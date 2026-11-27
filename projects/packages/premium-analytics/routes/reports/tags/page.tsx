/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters, useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	ExporterCsvAction,
	ReportPageLayout,
	ReportPageTabs,
	ReportErrorState,
	ReportRecordsTable,
	StatsOptionsMenu,
	TAGS_TERM_TYPES,
	tagsCsvExporter,
	tagsCsvExportersByType,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { Page } from '@wordpress/admin-ui';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { route } from '../package.json';
import reportPageStyles from '../page.module.scss';
import { REPORTS } from '../registry';
import { useReportParams } from '../use-report-params';
import {
	getReportTagsTabs,
	getTabLabel,
	getTagRowId,
	getTagsFields,
	resolveSection,
	useTagsReportRecords,
} from './config';
import type { StatsTagsItem, StatsTagsTermType } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

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
 * The table's search label for the rows on show.
 *
 * @param termType - The taxonomy the rows are narrowed to, if any.
 * @return The search label.
 */
function getSearchLabel( termType?: StatsTagsTermType ): string {
	if ( termType === 'tag' ) {
		return __( 'Search tags', 'jetpack-premium-analytics-pkg' );
	}

	if ( termType === 'category' ) {
		return __( 'Search categories', 'jetpack-premium-analytics-pkg' );
	}

	return __( 'Search tags and categories', 'jetpack-premium-analytics-pkg' );
}

/**
 * Premium Analytics Tags & categories report page component.
 *
 * `stats/tags` returns one flat list ranked over the report window and reports no
 * comparison, so there is no performance chart; the tabs narrow that list.
 *
 * @return The Tags & categories report page.
 */
function TagsReport(): JSX.Element {
	const reportParams = useReportParams();
	const tabs = useMemo( () => getReportTagsTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	const termType = TAGS_TERM_TYPES[ activeTab ];
	const records = useTagsReportRecords( reportParams, termType );
	const fields = useMemo( () => getTagsFields( termType ), [ termType ] );
	const dateFilters = useReportDateFilters( ROUTE_FROM );

	const { getLabel } = REPORTS.tags;

	return (
		<Page
			className={ reportPageStyles.page }
			visual={ <Icon icon={ jetpack } /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<>
					<ExporterCsvAction
						exporter={ termType ? tagsCsvExportersByType[ termType ] : tagsCsvExporter }
						items={ records.rows }
						status={ records }
						reportParams={ reportParams }
					/>
					<StatsOptionsMenu />
				</>
			}
		>
			<ReportPageLayout
				// "All" would be a bare heading, so that tab keeps the report's name.
				title={ activeTab === 'all' ? getLabel() : getTabLabel( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				dateFilters={ dateFilters }
			>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load tags and categories. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					{ /* Keyed by tab so search, sort and page reset with the row set. */ }
					<ReportRecordsTable< StatsTagsItem >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getTagRowId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ getSearchLabel( termType ) }
					/>
				</ReportErrorState>
			</ReportPageLayout>
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
