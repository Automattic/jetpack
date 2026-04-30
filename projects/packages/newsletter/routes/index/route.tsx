import { redirect } from '@wordpress/route';
import { getNewsletterScriptData } from '../../src/settings/script-data';

type SubscribersSearch = {
	subscriber?: string | number;
	u?: string | number;
};

export const route = {
	/**
	 * Bounce visitors to `/settings` when subscriber management is gated off
	 * server-side, so the page never shows an empty Subscribers stage when the
	 * filter has hidden the feature.
	 */
	beforeLoad: () => {
		if ( getNewsletterScriptData()?.subscriberManagementEnabled === false ) {
			throw redirect( { href: '/settings' } );
		}
	},
	/**
	 * Show the inspector slot only when a subscriber is selected via URL params.
	 * Boot's router calls this on every navigation and uses the boolean to
	 * decide whether to render the `<Inspector />` export.
	 *
	 * @param ctx        - Route loader context.
	 * @param ctx.search - URL search-param record.
	 * @return Whether to render the inspector slot.
	 */
	inspector: ( { search }: { search: SubscribersSearch } ) => {
		return Boolean( search?.subscriber || search?.u );
	},
};
