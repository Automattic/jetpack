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
	/**
	 * Fold or unfold the row. Omitted on a row with no children, which renders
	 * the empty slot instead: without it a childless row's title would sit a
	 * chevron's width to the left of its siblings'.
	 */
	onToggle?: () => void;
}

/**
 * The fold control for one drilldown row, in a slot every row reserves.
 *
 * A plain button rather than the design system's, because the control and the
 * empty slot have to occupy the identical box for titles at one depth to line
 * up, and `Button`'s own sizing wins over a passed class.
 *
 * State lives in `aria-expanded` rather than in the name, so a screen reader
 * announces the row's title once and its state alongside it.
 *
 * @param props          - The component props.
 * @param props.label    - The row's title, naming the control.
 * @param props.expanded - Whether the row's children are shown.
 * @param props.onToggle - Fold or unfold the row; omitted on a childless row.
 * @return The toggle slot.
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
