/**
 * External dependencies
 */
import { EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { cautionFilled } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './chart-empty-state.module.scss';

export type ChartEmptyStateProps = {
	/**
	 * Defaults to `cautionFilled` when omitted; pass `null` to render no icon.
	 */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ] | null;

	/**
	 * @default "No data in this period."
	 */
	text?: string;
};

/**
 * The empty state chart wrappers render when their data has nothing to show.
 */
export function ChartEmptyState( {
	icon = cautionFilled,
	text = __( 'No data in this period.', 'jetpack-premium-analytics-pkg' ),
}: ChartEmptyStateProps ) {
	return (
		<EmptyState.Root className={ styles.container }>
			{ /* 40px matches the error state's glyph so adjacent widgets showing
			     different states keep the same vertical rhythm. */ }
			{ icon && <Icon size={ 40 } className={ styles.icon } icon={ icon } /> }
			<EmptyState.Description>{ text }</EmptyState.Description>
		</EmptyState.Root>
	);
}
