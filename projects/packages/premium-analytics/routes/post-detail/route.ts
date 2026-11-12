/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';

type PostDetailParams = { postId?: string };

/**
 * `/post/$postId` moved to `/report/post/$id`. Bookmarks land here, so the
 * redirect carries the id and the whole search: dates, section and origin.
 */
export const route = {
	beforeLoad: ( {
		params,
		search,
	}: { params?: PostDetailParams; search?: Record< string, unknown > } = {} ) => {
		throw redirect( {
			to: '/report/$kind/$id',
			// The router is built dynamically, so the route has no statically typed params or search.
			params: { kind: 'post', id: params?.postId ?? '' } as unknown as never,
			search: ( search ?? {} ) as unknown as never,
			replace: true,
		} );
	},
};
