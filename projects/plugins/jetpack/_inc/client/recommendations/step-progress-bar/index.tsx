import { ProgressBar } from '@automattic/jetpack-components';
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
			<ProgressBar
				className={ 'progress-bar' }
				progressClassName={ 'progress-bar__progress' }
				progress={ progressValue / 100 }
			/>
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
