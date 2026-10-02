/**
 * External dependencies
 */
import { useReportDateFilters, useSectionTab } from '@jetpack-premium-analytics/routing';
import { StatsBreadcrumbs, StatsPageIcon } from '@jetpack-premium-analytics/ui';
import {
	ReportErrorState,
	ReportDrilldownTable,
	ReportPageLayout,
	ReportPageShell,
	ReportPageTabs,
	ExporterCsvAction,
	useReportRetry,
	utmCsvExporters,
	type UtmReportRow,
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
	getReportUtmTabs,
	getUtmFields,
	getUtmTabLabel,
	resolveSection,
	useUtmReportRecords,
} from './config';
import type { JSX } from 'react';

const ROUTE_FROM = route.path;

/*
 * No default sort: rows arrive as UTM parents followed by their posts. The
 * unsorted view preserves that hierarchy; user sorting stays within levels.
 */
const RECORDS_VIEW = {
	layout: {
		styles: {
			utmValue: { width: '100%' },
			views: { align: 'end' as const },
		},
	},
};

/**
 * Stable row id for the UTM records table.
 *
 * @param item - The UTM row.
 * @return The row id.
 */
function getUtmRowId( item: UtmReportRow ): string {
	return item.id;
}

/**
 * Resolve the UTM parent row id for nested post rows.
 *
 * @param item - The UTM or post row.
 * @return The parent row id, if any.
 */
function getUtmRowParentId( item: UtmReportRow ): string | undefined {
	return item.parentId;
}

/**
 * Premium Analytics UTM report page.
 *
 * @return The UTM report page.
 */
function UtmReport(): JSX.Element {
	const reportParams = useReportParams();
	const tabs = useMemo( () => getReportUtmTabs(), [] );
	const [ activeTab, setActiveTab ] = useSectionTab( ROUTE_FROM, resolveSection );
	const records = useUtmReportRecords( activeTab, reportParams );
	const retry = useReportRetry( records.refetch );
	const fields = useMemo( () => getUtmFields( activeTab ), [ activeTab ] );
	const dateFilters = useReportDateFilters( ROUTE_FROM );
	const { getLabel } = REPORTS.utm;

	let tableReplacement: JSX.Element | undefined;

	if ( records.isError ) {
		tableReplacement = (
			<ReportErrorState
				title={ __( 'Unable to load UTM data', 'jetpack-premium-analytics-pkg' ) }
				onRetry={ retry }
			/>
		);
	}

	return (
		<ReportPageShell
			visual={ <StatsPageIcon /> }
			breadcrumbs={ <StatsBreadcrumbs items={ [ { label: getLabel() } ] } /> }
			actions={
				<ExporterCsvAction
					exporter={ utmCsvExporters[ activeTab ] }
					items={ records.rows }
					status={ records }
					reportParams={ reportParams }
				/>
			}
		>
			<ReportPageLayout
				title={ getUtmTabLabel( activeTab ) }
				tabs={ <ReportPageTabs tabs={ tabs } value={ activeTab } onChange={ setActiveTab } /> }
				dateFilters={ dateFilters }
			>
				{ tableReplacement ?? (
					<ReportDrilldownTable< UtmReportRow >
						key={ activeTab }
						data={ records.rows }
						fields={ fields }
						getItemId={ getUtmRowId }
						getItemParentId={ getUtmRowParentId }
						isLoading={ records.isLoading }
						isFetching={ records.isFetching }
						initialView={ RECORDS_VIEW }
						searchLabel={ __( 'Search UTM values', 'jetpack-premium-analytics-pkg' ) }
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
 * Default export for the dynamic report registry.
 *
 * @return The UTM report page.
 */
export default function UtmReportPage(): JSX.Element {
	return <UtmReport />;
}
