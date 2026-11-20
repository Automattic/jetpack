/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';

type VideoDetailParams = { videoId?: string };

/**
 * `/video/$videoId` moved to `/report/video/$id`. Bookmarks land here, so the
 * redirect carries the id and the whole search: dates, comparison and origin.
 */
export const route = {
	beforeLoad: ( {
		params,
		search,
	}: { params?: VideoDetailParams; search?: Record< string, unknown > } = {} ) => {
		throw redirect( {
			to: '/report/$kind/$id',
			// The router is built dynamically, so the route has no statically typed params or search.
			params: { kind: 'video', id: params?.videoId ?? '' } as unknown as never,
			search: ( search ?? {} ) as unknown as never,
			replace: true,
		} );
	},
};
