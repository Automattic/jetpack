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
				if ( input.checkValidity && ! input.checkValidity() ) {
					isValid = false;
					input.reportValidity();
				}
			} );

			if ( ! isValid ) {
				return;
			}

			// Check if this is the last step
			if ( context.currentStep < context.maxSteps ) {
				// Update the form with the CSS variable for transition speed
				const form = event.target.closest( 'form' );
				if ( form && context.transitionSpeed ) {
					form.style.setProperty( '--jp-form-transition-speed', context.transitionSpeed );
				}

				// Set direction for animation
				context.direction = 'forward';
				// Update current step
				context.currentStep++;

				// Update URL with the new step
				this.callbacks.updateUrl();
			} else {
				// This is the last step, so we should submit the form
				const form = event.target.closest( 'form' );
				if ( form ) {
					form.submit();
				}
			}
		},

		prevStep( event ) {
			event.preventDefault();
			const context = getContext();

			// Check if this is the first step
			if ( context.currentStep > 1 ) {
				// Update the form with the CSS variable for transition speed
				const form = event.target.closest( 'form' );
				if ( form && context.transitionSpeed ) {
					form.style.setProperty( '--jp-form-transition-speed', context.transitionSpeed );
				}

				// Set direction for animation
				context.direction = 'backward';
				// Update current step
				context.currentStep--;

				// Update URL with the new step
				this.callbacks.updateUrl();
			}
		},
	},
	callbacks: {
		updateUrl: () => {
			const context = getContext();
			// update the query string to formId-step=currentStep to match PHP implementation
			const url = new URL( window.location.href );
			const stepParamName = `${ context.formId }-step`;
			url.searchParams.set( stepParamName, context.currentStep );
			window.history.pushState( {}, '', url );
		},
	},
} );
