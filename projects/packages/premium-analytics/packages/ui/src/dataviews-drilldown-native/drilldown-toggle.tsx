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
	/** Keep the control in place but inert, for a fold the reader cannot change yet. */
	disabled?: boolean;
	/** Fold or unfold the row. */
	onToggle: () => void;
}

/**
 * Render the fold control for a drilldown group row.
 */
export function DrilldownToggle( {
	label,
	expanded,
	disabled = false,
	onToggle,
}: DrilldownToggleProps ) {
	const collapsedIcon = isRTL() ? chevronLeft : chevronRight;

	return (
		<Button
			className={ styles.toggle }
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
