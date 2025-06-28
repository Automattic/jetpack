import { getContext, store } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

store( NAMESPACE, {
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
	},
} );
