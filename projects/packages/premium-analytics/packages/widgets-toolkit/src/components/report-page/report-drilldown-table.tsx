/**
 * External dependencies
 */
import {
	DataViewsDrilldownNative,
	type DataViewsDrilldownNativeProps,
} from '@jetpack-premium-analytics/ui';
/**
 * Internal dependencies
 */
import styles from './report-drilldown-table.module.scss';
import { ReportTableEmptyState } from './report-empty-state';
import { ReportPageSection } from './report-page-layout';
import { useTableRevalidating } from './use-table-revalidating';

export type ReportDrilldownTableProps< Item > = DataViewsDrilldownNativeProps< Item > & {
	/** Whether the rows on screen are revalidating; see `ReportRecordsTable`. */
	isFetching?: boolean;
};

/**
 * The report page's nested records table: `DataViewsDrilldownNative` framed
 * in the shared report section card, with the DataViews-in-a-card layout
 * fixes applied — the drilldown counterpart of `ReportRecordsTable`.
 *
 * @param {ReportDrilldownTableProps} props - The component props.
 * @return The drilldown records table section.
 */
export function ReportDrilldownTable< Item >( {
	isFetching = false,
	...props
}: ReportDrilldownTableProps< Item > ) {
	const isRevalidating = useTableRevalidating( isFetching );

	if ( props.data.length === 0 ) {
		return <ReportTableEmptyState isLoading={ props.isLoading ?? false } />;
	}

	return (
		<ReportPageSection className={ styles.root }>
			<DataViewsDrilldownNative< Item >
				{ ...props }
				isLoading={ props.isLoading || isRevalidating }
			/>
		</ReportPageSection>
	);
}
