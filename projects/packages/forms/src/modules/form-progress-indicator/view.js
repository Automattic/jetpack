import { getContext, store } from '@wordpress/interactivity';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
		get isStepActive() {
			const context = getContext();
			// Get the parent context (form context) and the local context (step context)
			const stepIndex = context.stepIndex;
			const currentStep = context.currentStep;

			// If we have a local stepIndex, compare it with the form's currentStep
			if ( typeof stepIndex !== 'undefined' && typeof currentStep !== 'undefined' ) {
				return stepIndex < currentStep;
			}
			return false;
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
	callbacks: {
		// No longer needed - active states are handled declaratively in PHP/JS
	},
} );
