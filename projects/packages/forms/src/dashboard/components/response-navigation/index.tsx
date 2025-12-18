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
	const sharedProps = {
		accessibleWhenDisabled: true,
		iconSize: 24,
		showTooltip: true,
		size: 'compact',
	};

	const closeButtonProps = {
		accessibleWhenDisabled: true,
		iconSize: 20,
		showTooltip: true,
		size: 'compact',
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
						onClick={ onPrevious }
					></Button>
				) }
				{ onNext && (
					<Button
						{ ...sharedProps }
						disabled={ ! hasNext }
						icon={ chevronDown }
						label={ __( 'Next', 'jetpack-forms' ) }
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
