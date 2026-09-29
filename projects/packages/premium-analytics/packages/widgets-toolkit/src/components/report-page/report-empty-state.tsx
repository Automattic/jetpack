/**
 * External dependencies
 */
import { EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
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
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Visual>
				<Icon icon={ search } size={ 48 } />
			</EmptyState.Visual>
			<EmptyState.Title>
				{ __( 'No data found', 'jetpack-premium-analytics-pkg' ) }
			</EmptyState.Title>
			<EmptyState.Description>
				{ hasPeriod
					? __( 'We couldn’t find results for this time period.', 'jetpack-premium-analytics-pkg' )
					: __( 'We couldn’t find any results.', 'jetpack-premium-analytics-pkg' ) }
			</EmptyState.Description>
		</EmptyState.Root>
	);
}

/**
 * What a report table renders in its place while it has no rows. The spinner keeps the table's search and settings off screen until the rows first arrive; a refetch after that keeps the empty state.
 *
 * @param {object}  props           - The component props.
 * @param {boolean} props.isLoading - Whether the rows are still loading.
 * @return The loading or empty state.
 */
export function ReportTableEmptyState( { isLoading }: { isLoading: boolean } ) {
	const [ hasSettled, setHasSettled ] = useState( ! isLoading );

	if ( ! isLoading && ! hasSettled ) {
		setHasSettled( true );
	}

	if ( isLoading && ! hasSettled ) {
		return (
			<div className={ styles.loading }>
				<Spinner />
			</div>
		);
	}

	return <ReportEmptyState />;
}
