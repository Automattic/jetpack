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
};

const ResponseNavigation = ( {
	hasNext,
	hasPrevious,
	onClose,
	onNext,
	onPrevious,
}: ResponseNavigationProps ): JSX.Element => {
	return (
		<div>
			{ onPrevious && (
				<Button
					accessibleWhenDisabled={ true }
					disabled={ ! hasPrevious }
					icon={ chevronUp }
					label={ __( 'Previous', 'jetpack-forms' ) }
					onClick={ onPrevious }
					showTooltip={ true }
					size="compact"
					variant="tertiary"
				></Button>
			) }
			{ onNext && (
				<Button
					accessibleWhenDisabled={ true }
					disabled={ ! hasNext }
					icon={ chevronDown }
					label={ __( 'Next', 'jetpack-forms' ) }
					onClick={ onNext }
					showTooltip={ true }
					size="compact"
					variant="tertiary"
				></Button>
			) }
			{ onClose && (
				<Button
					icon={ close }
					label={ __( 'Close', 'jetpack-forms' ) }
					onClick={ onClose }
					showTooltip={ true }
					size="compact"
					variant="tertiary"
				></Button>
			) }
		</div>
	);
};

export default ResponseNavigation;
