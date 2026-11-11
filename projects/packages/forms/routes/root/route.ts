/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getLastTab } from '../../src/dashboard/last-tab-cookie.ts';
import { TOP_TAB_PATHS } from '../../src/dashboard/top-tabs.ts';

export const route = {
	/**
	 * Sends a bare dashboard URL, which the boot router reads as `/`, to the remembered tab.
	 */
	beforeLoad: () => {
		// `/forms` itself falls back to the inbox when Central Form Management is off.
		throw redirect( { href: TOP_TAB_PATHS[ getLastTab() ?? 'forms' ] } );
	},
};
