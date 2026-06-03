type SubscribersSearch = {
	tab?: string;
	subscriber?: string | number;
	u?: string | number;
};

export const route = {
	/**
	 * Show the inspector slot only when a subscriber is selected via URL params
	 * AND the visitor is on the Subscribers tab. Boot's router calls this on
	 * every navigation and uses the boolean to decide whether to render the
	 * `<Inspector />` export. Stripping the inspector when the visitor flips to
	 * Settings keeps the subscriber-detail panel from hitchhiking across tabs.
	 *
	 * @param ctx        - Route loader context.
	 * @param ctx.search - URL search-param record.
	 * @return Whether to render the inspector slot.
	 */
	inspector: ( { search }: { search: SubscribersSearch } ) => {
		if ( search?.tab === 'settings' ) {
			return false;
		}
		return Boolean( search?.subscriber || search?.u );
	},
};
