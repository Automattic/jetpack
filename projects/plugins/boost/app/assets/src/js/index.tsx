import { StrictMode } from 'react';
import * as WPElement from '@wordpress/element';
import Main from './main';
import ModernApp from '$layout/modern/modern-app';
import { detectMode, LEGACY_ROOT_ID, waitForSlots } from '$lib/modern/mode';

/**
 * Render the legacy dashboard into the root PHP gives it.
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

	// StrictMode must be the root element to re-run mount effects in development in React 19.
	// See https://react.dev/reference/react/StrictMode#enabling-strict-mode-for-a-part-of-the-app
	WPElement.createRoot( slots.settings ).render(
		<StrictMode>
			<ModernApp subpageSlot={ slots.subpage } />
		</StrictMode>
	);
}

function render() {
	if ( detectMode() === 'modern' ) {
		renderModern();
	} else {
		renderLegacy();
	}
}

render();
