/**
 * External dependencies
 */
import { Stack } from '@jetpack-premium-analytics/externals';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PageEmptyState } from '../page-empty-state';
import styles from './report-empty-state.module.scss';
import { useReportHasPeriod } from './report-page-layout';

/**
 * Replace report sections when the report has no rows, centred in the space `ReportPageLayout` leaves below its section header.
 *
 * @return The report empty state.
 */
export function ReportEmptyState() {
	const hasPeriod = useReportHasPeriod();

	return (
		<PageEmptyState
			title={ __( 'No data found', 'jetpack-premium-analytics-pkg' ) }
			description={
				hasPeriod
					? __( 'We couldn’t find results for this time period.', 'jetpack-premium-analytics-pkg' )
					: __( 'We couldn’t find any results.', 'jetpack-premium-analytics-pkg' )
			}
		/>
	);
}

/**
 * What a report table renders in its place while it has no rows, so the table's search and settings stay off screen until rows arrive.
 *
 * @param {object}  props           - The component props.
 * @param {boolean} props.isLoading - Whether rows for the current params are still loading.
 * @return The loading or empty state.
 */
export function ReportTableEmptyState( { isLoading }: { isLoading: boolean } ) {
	if ( isLoading ) {
		return (
			<Stack className={ styles.loading } align="center" justify="center">
				<Spinner />
			</Stack>
		);
	}

	return <ReportEmptyState />;
}
