/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { isRTL } from '@wordpress/i18n';
import { chevronDown, chevronLeft, chevronRight } from '@wordpress/icons';
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
	 * Keep the control in place but inert, for a fold the reader cannot change
	 * yet. The row is still a group, so this must not fall back to the empty
	 * slot: that would read as a leaf and drop `aria-expanded` with it.
	 */
	disabled?: boolean;
	/** Fold or unfold the row. Omit to render an empty slot. */
	onToggle?: () => void;
}

/**
 * Render the fold control or an empty slot for a drilldown row.
 * The fixed-size slot keeps titles aligned at each depth.
 */
export function DrilldownToggle( {
	label,
	expanded,
	disabled = false,
	onToggle,
}: DrilldownToggleProps ) {
	if ( ! onToggle ) {
		return <span className={ styles.slot } aria-hidden="true" />;
	}

	const collapsedIcon = isRTL() ? chevronLeft : chevronRight;

	return (
		<Button
			className={ styles.slot }
			variant="minimal"
			tone="neutral"
			size="small"
			aria-label={ label }
			aria-expanded={ expanded }
			// `focusableWhenDisabled` is Button's default, so this stays in the
			// tab order and keeps announcing the group state.
			disabled={ disabled }
			onClick={ disabled ? undefined : onToggle }
		>
			<Button.Icon icon={ expanded ? chevronDown : collapsedIcon } size={ 16 } />
		</Button>
	);
}
