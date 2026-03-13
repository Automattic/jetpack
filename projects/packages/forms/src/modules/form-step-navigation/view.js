import {
	getContext,
	store,
	withSyncEvent as originalWithSyncEvent,
} from '@wordpress/interactivity';
import { focusNextInput } from '../form/shared.ts';

const NAMESPACE = 'jetpack/form';

const withSyncEvent =
	originalWithSyncEvent ||
	( cb =>
		( ...args ) =>
			cb( ...args ) );

const { state } = store( NAMESPACE, {
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

		get stepHasErrorFields() {
			const context = getContext();
			const fields = context.fields;

			const stepFields = Object.values( fields ).filter( field => {
				return field.step === context.currentStep;
			} );

			return stepFields.some( field => {
				return field.error !== 'yes';
			} );
		},
	},
	actions: {
		nextStep: withSyncEvent( event => {
			event.preventDefault();
			const context = getContext();

			if ( context.currentStep >= context.maxSteps ) {
				return;
			}
			context.showErrors = state.stepHasErrorFields;
			if ( state.stepHasErrorFields ) {
				return;
			}

			// Set direction to forward for animation
			context.direction = 'forward';

			// Update step after a small delay to allow animation to complete
			context.currentStep = context.currentStep + 1;
			const formHash = context.formHash;
			setTimeout( () => {
				focusNextInput( formHash );
			}, 100 );
		} ),

		previousStep: withSyncEvent( event => {
			event.preventDefault();
			const context = getContext();
			if ( context.currentStep <= 1 ) {
				return;
			}

			context.showErrors = false; // Reset the showErrors state

			// Set direction to backward for animation
			context.direction = 'backward';

			// Update step
			context.currentStep = context.currentStep - 1;

			const formHash = context.formHash;
			setTimeout( () => {
				focusNextInput( formHash );
			}, 100 );
		} ),
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
