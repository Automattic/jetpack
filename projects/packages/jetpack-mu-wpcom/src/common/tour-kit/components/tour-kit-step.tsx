/**
 * External Dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import clsx from 'clsx';
/**
 * Internal Dependencies
 */
import { classParser } from '../utils';
import type { Config, TourStepRendererProps } from '../types';

interface Props extends TourStepRendererProps {
	config: Config;
}

const TourKitStep: React.FunctionComponent< Props > = ( {
	config,
	steps,
	currentStepIndex,
	onMinimize,
	onDismiss,
	onNextStep,
	onPreviousStep,
	setInitialFocusedElement,
	onGoToStep,
} ) => {
	const isMobile = useViewportMatch( 'mobile', '<' );
	const classes = clsx(
		'tour-kit-step',
		`is-step-${ currentStepIndex }`,
		classParser(
			config.steps[ currentStepIndex ].options?.classNames?.[ isMobile ? 'mobile' : 'desktop' ]
		)
	);

	return (
		<div className={ classes }>
			<config.renderers.tourStep
				steps={ steps }
				currentStepIndex={ currentStepIndex }
				onDismiss={ onDismiss }
				onNextStep={ onNextStep }
				onPreviousStep={ onPreviousStep }
				onMinimize={ onMinimize }
				setInitialFocusedElement={ setInitialFocusedElement }
				onGoToStep={ onGoToStep }
			/>
		</div>
	);
};

export default TourKitStep;
