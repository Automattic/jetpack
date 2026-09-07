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
import { ReportPageSection } from './report-page-layout';

export type ReportDrilldownTableProps< Item > = DataViewsDrilldownNativeProps< Item >;

/**
 * The report page's nested records table: `DataViewsDrilldownNative` framed
 * in the shared report section card, with the DataViews-in-a-card layout
 * fixes applied — the drilldown counterpart of `ReportRecordsTable`.
 *
 * @param {ReportDrilldownTableProps} props - The component props.
 * @return The drilldown records table section.
 */
export function ReportDrilldownTable< Item >( props: ReportDrilldownTableProps< Item > ) {
	return (
		<ReportPageSection className={ styles.root }>
			<DataViewsDrilldownNative< Item > { ...props } />
		</ReportPageSection>
	);
}
