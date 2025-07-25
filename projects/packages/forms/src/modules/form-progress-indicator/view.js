import { getContext, store, getElement } from '@wordpress/interactivity';

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
		updateStepNames() {
			const context = getContext();
			const element = getElement();
			const wrapper = element.ref;

			// Update active states for all steps
			const steps = wrapper?.querySelectorAll( '.jetpack-form-progress-indicator-step' );
			if ( steps ) {
				steps.forEach( ( step, index ) => {
					if ( index < context.currentStep ) {
						step.classList.add( 'is-active' );
					} else {
						step.classList.remove( 'is-active' );
					}
				} );
			}
		},
	},
} );
