import { getContext, store } from '@wordpress/interactivity';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
		get isStepActive() {
			const context = getContext();
			// For progress indicator steps, we want to show as active if currentStep === stepIndex + 1
			// stepIndex is 0-based, currentStep is 1-based
			return context.currentStep === context.stepIndex + 1;
		},
		get isStepCompleted() {
			const context = getContext();
			// Step is completed if currentStep > stepIndex + 1
			// stepIndex is 0-based, currentStep is 1-based
			return context.currentStep > context.stepIndex + 1;
		},
		get getStepContent() {
			const context = getContext();
			// Return checkmark for completed steps, number for others
			if ( context.currentStep > context.stepIndex + 1 ) {
				return '✓';
			}
			return context.stepIndex + 1;
		},
	},
	actions: {
		initializeProgress() {
			// Initialize progress indicator when the form loads
			// The steps are already server-rendered, we just need to ensure they're updated
			const context = getContext();

			// Ensure we have a valid transition value
			if (
				! context.transition ||
				! [ 'none', 'fade', 'slide', 'fade-slide' ].includes( context.transition )
			) {
				context.transition = 'fade-slide'; // Default transition if not set or invalid
			}
		},
		renderStepNames() {
			// Steps are now server-rendered, no need to create them via JavaScript
			// This function is kept for compatibility but doesn't do anything
		},
	},
	callbacks: {},
} );
