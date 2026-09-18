/**
 * Runtime boundary between today's dashboard and the modern wp-build chassis.
 *
 * PHP resolves `rsm_jetpack_ui_modernization_boost` once per request and renders
 * exactly one root. Which root exists is the mode signal.
 */

import { SETTINGS_SLOT_ID, SUBPAGE_SLOT_ID } from '../../../../../../_inc/runtime-contract';

export const LEGACY_ROOT_ID = 'jb-admin-settings';
export const MODERN_ROOT_ID = 'jetpack-boost-dashboard-wp-admin-app';

export type DashboardMode = 'legacy' | 'modern';

export type ModernSlots = {
	settings: HTMLElement;
	subpage: HTMLElement;
};

/**
 * Detect which dashboard PHP rendered.
 *
 * @param doc - Document to inspect. Defaults to the live document.
 * @return The mode, or null when neither root is present.
 */
export function detectMode( doc: Document = document ): DashboardMode | null {
	// Legacy wins if both are somehow present, so a chassis bug can't take today's dashboard away.
	if ( doc.getElementById( LEGACY_ROOT_ID ) ) {
		return 'legacy';
	}

	if ( doc.getElementById( MODERN_ROOT_ID ) ) {
		return 'modern';
	}

	return null;
}

/**
 * Find both chassis slots, if they are already rendered.
 *
 * @param doc - Document to inspect.
 * @return Both slots, or null while either is missing.
 */
function findSlots( doc: Document ): ModernSlots | null {
	const settings = doc.getElementById( SETTINGS_SLOT_ID );
	const subpage = doc.getElementById( SUBPAGE_SLOT_ID );

	return settings && subpage ? { settings, subpage } : null;
}

/**
 * Resolve once the chassis has created both slots.
 *
 * This app can boot before the chassis renders, so the modern mount waits rather
 * than assuming the slots exist. There is deliberately no timeout: without a
 * chassis there is no tab shell to render into either.
 *
 * @param doc - Document to observe.
 * @return Both slots.
 */
export function waitForSlots( doc: Document = document ): Promise< ModernSlots > {
	const present = findSlots( doc );
	if ( present ) {
		return Promise.resolve( present );
	}

	return new Promise( resolve => {
		const observer = new MutationObserver( () => {
			const slots = findSlots( doc );
			if ( slots ) {
				observer.disconnect();
				resolve( slots );
			}
		} );

		observer.observe( doc.body, { childList: true, subtree: true } );
	} );
}
