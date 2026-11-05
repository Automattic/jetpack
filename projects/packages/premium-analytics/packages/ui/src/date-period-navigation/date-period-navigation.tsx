/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import type { StepDirection } from '@jetpack-premium-analytics/datetime';

import './date-period-navigation.scss';

type DatePeriodNavigationProps = {
	/**
	 * Whether the window has a past to step into. Derived upstream from the
	 * range and the plan's earliest date, so the arrow follows the data, not a layout rule.
	 */
	canStepBackward?: boolean;

	/**
	 * Whether the window has a future to step into.
	 */
	canStepForward: boolean;

	/** Greys the arrows out but keeps them focusable: a passing state, not a missing control. */
	disabled?: boolean;

	/**
	 * Fired with the direction the reader asked for.
	 */
	onStep: ( direction: StepDirection ) => void;
};

/**
 * Steps the active window backward and forward by its own length.
 *
 * An arrow with nowhere to go is disabled rather than hidden, so the pair keeps
 * its place in the row and the reader can see the edge they have reached.
 *
 * @param {DatePeriodNavigationProps} props - The props for the DatePeriodNavigation component.
 * @return The navigation element.
 */
export function DatePeriodNavigation( {
	canStepBackward = true,
	canStepForward,
	disabled = false,
	onStep,
}: DatePeriodNavigationProps ) {
	// The glyphs swap in RTL so each keeps pointing at its own edge of the row.
	const previousIcon = isRTL() ? chevronRight : chevronLeft;
	const nextIcon = isRTL() ? chevronLeft : chevronRight;

	return (
		<div className={ clsx( 'date-period-navigation', { 'is-disabled': disabled } ) }>
			{ /* The glyph carries no wording, so the name is the whole label. */ }
			<Button
				className="date-period-navigation__step"
				variant="minimal"
				tone="neutral"
				size="small"
				aria-label={ __( 'Previous period', 'jetpack-premium-analytics-pkg' ) }
				disabled={ disabled || ! canStepBackward }
				onClick={ () => onStep( 'previous' ) }
			>
				<Button.Icon icon={ previousIcon } />
			</Button>

			<Button
				className="date-period-navigation__step"
				variant="minimal"
				tone="neutral"
				size="small"
				aria-label={ __( 'Next period', 'jetpack-premium-analytics-pkg' ) }
				disabled={ disabled || ! canStepForward }
				onClick={ () => onStep( 'next' ) }
			>
				<Button.Icon icon={ nextIcon } />
			</Button>
		</div>
	);
}
