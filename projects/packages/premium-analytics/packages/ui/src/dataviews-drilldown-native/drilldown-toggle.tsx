/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { isRTL } from '@wordpress/i18n';
import { chevronDown, chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './drilldown-toggle.module.scss';

export interface DrilldownToggleProps {
	/** The row's title, which names the control for screen readers. */
	label: string;
	/** Whether the row's children are currently shown. */
	expanded: boolean;
	/** Fold or unfold the row. Omit to render an empty slot. */
	onToggle?: () => void;
}

/**
 * Render the fold control or an empty slot for a drilldown row.
 * The fixed-size slot keeps titles aligned at each depth.
 */
export function DrilldownToggle( { label, expanded, onToggle }: DrilldownToggleProps ) {
	if ( ! onToggle ) {
		return <span className={ styles.slot } aria-hidden="true" />;
	}

	const collapsedIcon = isRTL() ? chevronLeft : chevronRight;

	return (
		<button
			type="button"
			className={ clsx( styles.slot, styles.toggle ) }
			aria-label={ label }
			aria-expanded={ expanded }
			onClick={ onToggle }
		>
			<Icon icon={ expanded ? chevronDown : collapsedIcon } size={ 16 } />
		</button>
	);
}
