import * as WPElement from '@wordpress/element';
import Main from './main';
import ModernApp from '$layout/modern/modern-app';
import { detectMode, LEGACY_ROOT_ID, waitForSlots } from '$lib/modern/mode';

const APP_ROOT_ID = 'jb-modern-root';

/**
 * Render today's dashboard into the root PHP gives it.
 */
function renderLegacy() {
	const container = document.getElementById( LEGACY_ROOT_ID );

	if ( null === container ) {
		return;
	}

	const component = <Main />;

	WPElement.createRoot( container ).render( component );
}

/**
 * Render the modern app once the chassis has created its slots.
 *
 * The root lives in a container of our own and never in a chassis slot, so one
 * root can portal into both slots and outlive whichever is showing.
 */
async function renderModern() {
	const slots = await waitForSlots();

	const container = document.createElement( 'div' );
	container.id = APP_ROOT_ID;
	container.hidden = true;
	document.body.appendChild( container );

	WPElement.createRoot( container ).render( <ModernApp slots={ slots } /> );
}

/**
 * Initial render function.
 */
function render() {
	if ( detectMode() === 'modern' ) {
		renderModern();

		return;
	}

	renderLegacy();
}

render();
