/**
 * External dependencies
 */
import { store as bootStore } from '@wordpress/boot';
import { dispatch } from '@wordpress/data';
import { chartBar } from '@wordpress/icons';

/**
 * Initialize the Jetpack Analytics app.
 * Runs before routes render.
 */
export async function init(): Promise< void > {
	dispatch( bootStore ).updateMenuItem( 'dashboard', {
		icon: chartBar,
	} );
}
