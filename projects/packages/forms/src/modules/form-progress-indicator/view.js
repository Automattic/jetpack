import { getContext, store } from '@wordpress/interactivity';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
		get getDotsProgress() {
			const context = getContext();
			const totalSteps = context.maxSteps;
			if ( totalSteps <= 1 ) {
				return '0%';
			}
			const completedSteps = Math.max( 0, context.currentStep - 1 );
			return ( completedSteps / ( totalSteps - 1 ) ) * 100 + '%';
		},
		get isStepActive() {
			const context = getContext();
			return context.currentStep === context.stepIndex + 1;
		},
		get isStepCompleted() {
			const context = getContext();
			return context.currentStep > context.stepIndex + 1;
		},
		get getStepContent() {
			const context = getContext();
			if ( context.currentStep > context.stepIndex + 1 ) {
				return '✓';
			}
			return context.stepIndex + 1;
		},
	},
} );
