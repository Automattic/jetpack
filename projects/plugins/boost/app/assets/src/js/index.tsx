import * as WPElement from '@wordpress/element';
import Main from './main';
import ModernApp from '$layout/modern/modern-app';
import { detectMode, LEGACY_ROOT_ID, waitForSlots } from '$lib/modern/mode';

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
 * The root lives in the Settings slot and portals the sub-page into the other
 * chassis mount, so one provider tree spans both and Settings is never remounted.
 */
async function renderModern() {
	const slots = await waitForSlots();

	WPElement.createRoot( slots.settings ).render( <ModernApp subpageSlot={ slots.subpage } /> );
}

function render() {
	if ( detectMode() === 'modern' ) {
		renderModern();
	} else {
		renderLegacy();
	}
}

render();
