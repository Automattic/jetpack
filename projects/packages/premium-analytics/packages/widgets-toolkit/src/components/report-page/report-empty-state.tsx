/**
 * External dependencies
 */
import { EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { search } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './report-empty-state.module.scss';

/**
 * Replace report sections when the selected period has no rows, centred in the space `ReportPageLayout` leaves below its section header.
 *
 * @return The report empty state.
 */
export function ReportEmptyState() {
	return (
		<EmptyState.Root className={ styles.root }>
			<EmptyState.Visual>
				<Icon icon={ search } size={ 48 } />
			</EmptyState.Visual>
			<EmptyState.Title>
				{ __( 'No data found', 'jetpack-premium-analytics-pkg' ) }
			</EmptyState.Title>
			<EmptyState.Description>
				{ __( 'We couldn’t find results for this time period.', 'jetpack-premium-analytics-pkg' ) }
			</EmptyState.Description>
		</EmptyState.Root>
	);
}
