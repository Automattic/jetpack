import { addQueryArgs } from '@wordpress/url';
import { REST_NAMESPACE } from '../constants';
import useSimpleMutation from './use-simple-mutation';
import useSimpleQuery from './use-simple-query';
import type { SeoPostsResponse, SeoPostUpdatePayload } from './content-types';

interface UseSeoPostsArgs {
	postType?: string;
	status?: string;
	page?: number;
	perPage?: number;
	search?: string;
}

export const useSeoPosts = ( args: UseSeoPostsArgs ) => {
	const query = {
		post_type: args.postType ?? 'post',
		status: args.status ?? 'publish,draft',
		page: String( args.page ?? 1 ),
		per_page: String( args.perPage ?? 20 ),
		...( args.search ? { search: args.search } : {} ),
	};
	const path = addQueryArgs( `/${ REST_NAMESPACE }/posts`, query );
	return useSimpleQuery< SeoPostsResponse >( {
		name: 'jetpack-seo-posts',
		query: { path },
	} );
};

export const useUpdateSeoPost = ( postId: number ) =>
	useSimpleMutation< unknown, SeoPostUpdatePayload >( {
		name: `jetpack-seo-post-update-${ postId }`,
		query: {
			path: `/${ REST_NAMESPACE }/posts/${ postId }/seo`,
			method: 'POST',
		},
		invalidates: [ 'jetpack-seo-posts', 'jetpack-seo-overview' ],
	} );
