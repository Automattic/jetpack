import '../css/admin-style.scss';
import { StrictMode } from 'react';
import * as WPElement from '@wordpress/element';
import ModernApp from '$layout/modern/modern-app';
import { detectMode, waitForSlots } from '$lib/modern/mode';

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

if ( detectMode() === 'modern' ) {
	renderModern();
}
