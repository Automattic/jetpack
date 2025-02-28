import { store } from '@wordpress/interactivity';

store( 'myInteractivePlugin', {
	state: {
		isVisible: false,
	},
	actions: {
		toggleVisibility() {},
	},
} );
