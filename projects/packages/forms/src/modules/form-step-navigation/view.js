import { getContext, store } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';
store( NAMESPACE, {
	state: {
		get isFirstStep() {
			const context = getContext();
			return context.currentStep === 1;
		},

		get isLastStep() {
			const context = getContext();
			return context.currentStep === context.maxSteps;
		},

		get isNotLastStep() {
			const context = getContext();
			return context.currentStep !== context.maxSteps;
		},
	},
	actions: {
		nextStep( event ) {
			event.preventDefault();
			const context = getContext();

			// Add validation check
			const currentStepElement = document.querySelector(
				`.jetpack-form-step[data-wp-context*='"step":${ context.currentStep }']`
			);
			const inputs = currentStepElement.querySelectorAll( 'input, select, textarea' );
			let isValid = true;

			inputs.forEach( input => {
				if ( ! input.checkValidity() ) {
					isValid = false;
					input.reportValidity();
				}
			} );

			if ( ! isValid ) return;

			if ( context.currentStep >= context.maxSteps ) {
				return;
			}

			// Set direction to forward for animation
			context.direction = 'forward';

			// Update step after a small delay to allow animation to complete
			context.currentStep = context.currentStep + 1;
		},

		previousStep( event ) {
			event.preventDefault();
			const context = getContext();
			if ( context.currentStep <= 1 ) {
				return;
			}

			// Set direction to backward for animation
			context.direction = 'backward';

			// Update step
			context.currentStep = context.currentStep - 1;
		},
	},
	callbacks: {
		updateUrl: () => {
			const context = getContext();
			// update the query string ?step to currentStep
			const url = new URL( window.location.href );
			url.searchParams.set( 'step', context.currentStep );
			window.history.pushState( {}, '', url );
		},
	},
} );
