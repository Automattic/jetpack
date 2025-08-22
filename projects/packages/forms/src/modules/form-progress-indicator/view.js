import { getContext, store } from '@wordpress/interactivity';
import { calculateProgressPercentage } from '../../blocks/shared/util/progress-calculation';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return calculateProgressPercentage( context.currentStep, context.maxSteps, false ) + '%';
		},
		get getDotsProgress() {
			const context = getContext();
			return calculateProgressPercentage( context.currentStep, context.maxSteps, true ) + '%';
		},
	},
} );
