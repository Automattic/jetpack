/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { cautionFilled } from '@wordpress/icons';
import { EmptyState, Icon } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './chart-empty-state.module.scss';

export type ChartEmptyStateProps = {
	/**
	 * Icon to display in the empty state.
	 * Should be a ReactNode (typically an SVG icon).
	 * Defaults to cautionFilled when omitted; pass `null` to render no icon.
	 */
	icon?: React.ComponentProps< typeof Icon >[ 'icon' ] | null;

	/**
	 * Text to display in the empty state.
	 * @default "No data in this period."
	 */
	text?: string;
};

/**
 * ChartEmptyState component.
 *
 * A reusable empty state component for charts that displays an icon and text
 * when no data is available. Designed to be used by chart wrapper components.
 *
 * @example
 * ```tsx
 * import { customer } from '@jetpack-premium-analytics/icons';
 *
 * // With custom icon
 * <ChartEmptyState icon={ customer } />
 *
 * // With custom text
 * <ChartEmptyState
 *   icon={ customer }
 *   text="No customer data found."
 * />
 * ```
 */
export function ChartEmptyState( {
	icon = cautionFilled,
	text = __( 'No data in this period.', 'jetpack-premium-analytics' ),
}: ChartEmptyStateProps ) {
	return (
		<EmptyState.Root className={ styles.container }>
			{ icon && <Icon size={ 48 } className={ styles.icon } icon={ icon } /> }
			<EmptyState.Description>{ text }</EmptyState.Description>
		</EmptyState.Root>
	);
}
