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
			// Ensure we have valid transition values
			if (
				! context.transition ||
				! [ 'none', 'fade', 'slide', 'fade-slide' ].includes( context.transition )
			) {
				context.transition = 'fade-slide'; // Default transition if not set or invalid
			}

			// Apply transition speed as CSS variable
			const indicator = document.querySelector( '.jetpack-form-progress-indicator' );
			if ( indicator && context.transitionSpeed ) {
				indicator.style.setProperty( '--jp-form-transition-speed', context.transitionSpeed );

				// Also set it on the form for steps
				const form = indicator.closest( 'form' );
				if ( form ) {
					form.style.setProperty( '--jp-form-transition-speed', context.transitionSpeed );
				}
			}
		},
	},
} );
