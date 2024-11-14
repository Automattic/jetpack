import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import WpcomTourKitPaginationControl from './wpcom-tour-kit-pagination-control';
import type { WpcomTourStepRendererProps } from '../../../types';

type Props = Omit< WpcomTourStepRendererProps, 'onMinimize' >;

const WpcomTourKitStepCardNavigation: React.FunctionComponent< Props > = ( {
	currentStepIndex,
	onDismiss,
	onGoToStep,
	onNextStep,
	onPreviousStep,
	setInitialFocusedElement,
	steps,
} ) => {
	const isFirstStep = currentStepIndex === 0;
	const lastStepIndex = steps.length - 1;

	return (
		<>
			<WpcomTourKitPaginationControl
				activePageIndex={ currentStepIndex }
				numberOfPages={ lastStepIndex + 1 }
				onChange={ onGoToStep }
			>
				{ isFirstStep ? (
					<div>
						<Button variant="tertiary" onClick={ onDismiss( 'no-thanks-btn' ) }>
							{ __( 'Skip', 'jetpack-mu-wpcom' ) }
						</Button>
						<Button
							className="wpcom-tour-kit-step-card-navigation__next-btn"
							variant="primary"
							onClick={ onNextStep }
							ref={ setInitialFocusedElement }
						>
							{ __( 'Take the tour', 'jetpack-mu-wpcom' ) }
						</Button>
					</div>
				) : (
					<div>
						<Button variant="tertiary" onClick={ onPreviousStep }>
							{ __( 'Back', 'jetpack-mu-wpcom' ) }
						</Button>
						<Button
							className="wpcom-tour-kit-step-card-navigation__next-btn"
							variant="primary"
							onClick={ onNextStep }
							ref={ setInitialFocusedElement }
						>
							{ __( 'Next', 'jetpack-mu-wpcom' ) }
						</Button>
					</div>
				) }
			</WpcomTourKitPaginationControl>
		</>
	);
};

export default WpcomTourKitStepCardNavigation;
