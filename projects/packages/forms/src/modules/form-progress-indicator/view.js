import { getContext, store, getElement } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';
store( NAMESPACE, {
	state: {
		get getStepProgress() {
			const context = getContext();
			return ( Math.max( 1, context.currentStep ) / context.maxSteps ) * 100 + '%';
		},
	},
	actions: {
		initializeProgress: () => {
			const { ref } = getElement();
			const { getStepProgress } = store( NAMESPACE ).state;
			if ( ref && getStepProgress ) {
				ref.style.setProperty( '--progress', getStepProgress );
			}
		},
	},
} );
