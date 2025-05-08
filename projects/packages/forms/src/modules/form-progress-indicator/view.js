import { getContext, store } from '@wordpress/interactivity';

store( 'jetpack/form', {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
	},
	actions: {
		initializeProgress() {
			// Initialize progress indicator when the form loads
			const context = getContext();
			// Ensure we have a valid transition value
			if (
				! context.transition ||
				! [ 'none', 'fade', 'slide', 'fade-slide' ].includes( context.transition )
			) {
				context.transition = 'fade-slide'; // Default transition if not set or invalid
			}
		},
	},
} );
