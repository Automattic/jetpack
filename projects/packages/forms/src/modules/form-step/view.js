import { getContext, store } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

const { state } = store( NAMESPACE, {
	state: {
		get isCurrentStep() {
			const context = getContext();
			return context.currentStep === context.step;
		},

		get isAfterCurrent() {
			const context = getContext();
			return context.currentStep < context.step;
		},

		get isBeforeCurrent() {
			const context = getContext();
			return context.currentStep > context.step;
		},

		get step() {
			return state.form.querySelector( '.jetpack-form-step.is-current-step' );
		},

		get stepInputs() {
			return state.step.querySelectorAll( '.grunion-field' );
		},
	},
} );
