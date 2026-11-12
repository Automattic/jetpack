/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { jetpack } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs } from '@jetpack-premium-analytics/ui';
import {
	ReportDrilldownTable,
	ExporterCsvAction,
	ReportPageLayout,
	ReportErrorState,
	authorsCsvExporter,
	type AuthorRow,
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
	const fields = useMemo(
		() => getAuthorsFields( records.hasComparison ),
		[ records.hasComparison ]
	);

	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.authors;

	return (
		<Page
			className={ reportPageStyles.page }
			visual={ <Icon icon={ jetpack } /> }
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
			<ReportPageLayout title={ getLabel() } dateFilters={ dateFilters } withAllTime>
				<ReportErrorState
					status={ records }
					retryDescription={ __(
						"We couldn't load authors. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					) }
				>
					<ReportDrilldownTable< AuthorRow >
						data={ records.rows }
						fields={ fields }
						getItemId={ getAuthorRowId }
						getItemParentId={ getAuthorRowParentId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search authors', 'jetpack-premium-analytics-pkg' ) }
						hideLevelMarkers
						collapsible
						defaultExpanded="none"
					/>
				</ReportErrorState>
			</ReportPageLayout>
		</Page>
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
