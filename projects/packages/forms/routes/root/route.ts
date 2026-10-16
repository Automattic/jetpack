/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getLastTab } from '../../src/dashboard/last-tab-cookie.ts';

export const route = {
	/**
	 * Sends a bare dashboard URL, which the boot router reads as `/`, to the remembered tab.
	 * Done here rather than with a server redirect, which cost every visit a second page load.
	 */
	beforeLoad: () => {
		// `/forms` itself falls back to the inbox when Central Form Management is off.
		throw redirect( { href: getLastTab() === 'responses' ? '/responses/inbox' : '/forms' } );
	},
};
