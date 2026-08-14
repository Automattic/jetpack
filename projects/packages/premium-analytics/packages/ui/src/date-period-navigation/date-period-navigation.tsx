/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

import './date-period-navigation.scss';

type DatePeriodNavigationProps = {
	/**
	 * Whether the window has a future to step into. Derived upstream from the
	 * range rather than from a layout rule, so the control follows where the
	 * window sits in time.
	 */
	canStepForward: boolean;

	/**
	 * Fired with the direction the reader asked for.
	 */
	onStep: ( direction: 'previous' | 'next' ) => void;
};

/**
 * Steps the active window backward and forward by its own length.
 *
 * The forward control is absent rather than disabled on the latest window: a
 * disabled arrow states a rule the reader has to work out, and on a live preset
 * that rule holds for as long as they stay on it.
 *
 * @param {DatePeriodNavigationProps} props - The props for the DatePeriodNavigation component.
 * @return The navigation element.
 */
export function DatePeriodNavigation( { canStepForward, onStep }: DatePeriodNavigationProps ) {
	return (
		<div className="date-period-navigation">
			{ /* The glyph carries no wording, so the name is the whole label. */ }
			<Button
				className="date-period-navigation__step"
				variant="minimal"
				tone="neutral"
				size="small"
				aria-label={ __( 'Previous period', 'jetpack-premium-analytics-pkg' ) }
				onClick={ () => onStep( 'previous' ) }
			>
				<Button.Icon icon={ chevronLeft } />
			</Button>

			{ canStepForward && (
				<Button
					className="date-period-navigation__step"
					variant="minimal"
					tone="neutral"
					size="small"
					aria-label={ __( 'Next period', 'jetpack-premium-analytics-pkg' ) }
					onClick={ () => onStep( 'next' ) }
				>
					<Button.Icon icon={ chevronRight } />
				</Button>
			) }
		</div>
	);
}
