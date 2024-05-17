import apiFetch from '@wordpress/api-fetch';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useMemo } from '@wordpress/element';

/**
 * Fetch Related Posts.
 *
 * @param {number} postId - The ID of the post.
 * @returns {Promise<Array>} The related posts.
 */
async function fetchRelatedPosts( postId ) {
	try {
		const result = await apiFetch( {
			path: `/wpcom/v2/related-posts/${ postId }`,
		} );
		return result;
	} catch ( error ) {
		return [];
	}
}

const useRelatedPosts = isEnabled => {
	const prevIsEnabled = usePrevious( isEnabled );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ relatedPosts, setRelatedPosts ] = useState( null );
	const { currentPostId, currentPostRelatedPosts } = useSelect( select => {
		const currentPost = select( editorStore ).getCurrentPost();
		return {
			currentPostId: currentPost.id,
			currentPostRelatedPosts: currentPost?.[ 'jetpack-related-posts' ] ?? [],
		};
	} );

	const shouldFetchRelatedPosts =
		currentPostRelatedPosts.length === 0 && ! prevIsEnabled && isEnabled;

	useEffect( () => {
		if ( ! shouldFetchRelatedPosts ) {
			return;
		}

		setIsLoading( true );
		fetchRelatedPosts( currentPostId )
			.then( value => {
				setRelatedPosts( value );
			} )
			.catch( () => {} )
			.then( () => {
				setIsLoading( false );
			} );
	}, [ shouldFetchRelatedPosts, currentPostId ] );

	return useMemo(
		() => ( {
			posts: relatedPosts ?? currentPostRelatedPosts,
			isLoading,
		} ),
		[ isLoading, relatedPosts, currentPostRelatedPosts ]
	);
};

export { useRelatedPosts };
