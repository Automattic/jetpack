/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

export const route = {
	/**
	 * Redirect `/` to the default inbox view.
	 *
	 * In wp-admin integrated mode, the boot router uses the `p` query arg and defaults to `/`
	 * when missing. Adding this route lets us redirect to the default inbox view.
	 */
	beforeLoad: () => {
		throw redirect( { href: '/responses/inbox' } );
	},
};
