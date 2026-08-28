/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { close, chevronUp, chevronDown } from '@wordpress/icons';

type ResponseNavigationProps = {
	hasNext: boolean;
	hasPrevious: boolean;
	onClose: ( () => void ) | null;
	onNext: () => void;
	onPrevious: () => void;
	// Keys to advertise in the arrow tooltips. Opt-in, because this component is
	// also used by the inbox inspector, which does not bind them — a tooltip
	// promising a key that does nothing is worse than no tooltip.
	//
	// Widened to match what `Button` accepts for `shortcut`; the arrows are labelled
	// with the bare key today, but a caller may need the `ariaLabel` form.
	nextShortcut?: string | { display: string; ariaLabel: string };
	previousShortcut?: string | { display: string; ariaLabel: string };
};

const ResponseNavigation = ( {
	hasNext,
	hasPrevious,
	onClose,
	onNext,
	onPrevious,
	nextShortcut,
	previousShortcut,
}: ResponseNavigationProps ): JSX.Element => {
	const sharedProps = {
		accessibleWhenDisabled: true,
		iconSize: 24,
		showTooltip: true,
		size: 'compact' as const,
	};

	const closeButtonProps = {
		accessibleWhenDisabled: true,
		iconSize: 20,
		showTooltip: true,
		size: 'compact' as const,
	};

	return (
		<div className="jp-forms-response-navigation">
			<div className="jp-forms-response-navigation__arrows">
				{ onPrevious && (
					<Button
						{ ...sharedProps }
						disabled={ ! hasPrevious }
						icon={ chevronUp }
						label={ __( 'Previous', 'jetpack-forms' ) }
						shortcut={ previousShortcut }
						onClick={ onPrevious }
					></Button>
				) }
				{ onNext && (
					<Button
						{ ...sharedProps }
						disabled={ ! hasNext }
						icon={ chevronDown }
						label={ __( 'Next', 'jetpack-forms' ) }
						shortcut={ nextShortcut }
						onClick={ onNext }
					></Button>
				) }
			</div>
			{ onClose && (
				<Button
					{ ...closeButtonProps }
					icon={ close }
					label={ __( 'Close', 'jetpack-forms' ) }
					onClick={ onClose }
				></Button>
			) }
		</div>
	);
};

export default ResponseNavigation;
