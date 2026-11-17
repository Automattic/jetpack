/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';

type AuthorDetailParams = { authorId?: string };

/**
 * `/author/$authorId` moved to `/report/author/$id`. Bookmarks land here, so the
 * redirect carries the id and the whole search: dates and origin.
 */
export const route = {
	beforeLoad: ( {
		params,
		search,
	}: { params?: AuthorDetailParams; search?: Record< string, unknown > } = {} ) => {
		throw redirect( {
			to: '/report/$kind/$id',
			// The router is built dynamically, so the route has no statically typed params or search.
			params: { kind: 'author', id: params?.authorId ?? '' } as unknown as never,
			search: ( search ?? {} ) as unknown as never,
			replace: true,
		} );
	},
};
