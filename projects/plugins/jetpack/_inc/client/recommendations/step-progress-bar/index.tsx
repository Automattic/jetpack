import ProgressBar from '@automattic/components/dist/esm/progress-bar';
import { __, sprintf } from '@wordpress/i18n';
import './style.scss';

type Props = {
	currentStepIndex: number;
	totalSteps: number;
};
export const StepProgressBar = ( { currentStepIndex, totalSteps }: Props ) => {
	if ( -1 === currentStepIndex ) {
		return null;
	}

	const progressValue = ( currentStepIndex / ( totalSteps - 1 ) ) * 100;

	return (
		<div className="step-progress-bar">
			<ProgressBar color={ '#00A32A' } value={ progressValue } />
			<span className="step-progress-bar__label">
				{ sprintf(
					/* Translators: %1$s is the current step number, %2$s are total steps */
					__( 'Step %1$s of %2$s', 'jetpack' ),
					currentStepIndex + 1,
					totalSteps
				) }
			</span>
		</div>
	);
};
