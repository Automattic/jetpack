import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useMemo } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';

// Tries to create a tag or fetch it if it already exists.
// @link https://github.com/WordPress/gutenberg/blob/98b58d9042eda7590659c6cce2cf7916ba99aaa1/packages/editor/src/components/post-taxonomies/flat-term-selector.js#L55
function findOrCreateTag( tagName ) {
	const escapedTagName = escapeHTML( tagName );

	return apiFetch( {
		path: `/wp/v2/tags`,
		method: 'POST',
		data: { name: escapedTagName },
	} ).catch( error => {
		if ( error.code !== 'term_exists' ) {
			return Promise.reject( error );
		}

		return Promise.resolve( {
			id: error.data.term_id,
			name: tagName,
		} );
	} );
}

export function usePromptTags( promptId, tagsAdded, setTagsAdded ) {
	const { editPost } = useDispatch( 'core/editor' );

	// Track the status of requests to create or fetch tags.
	// Statuses are 'not-started', 'pending', 'fulfilled', or 'rejected'.
	const promptTagRequestStatus = useRef( 'not-started' );

	// Get the selector function for use in the Promise chain
	const { getEditedPostAttribute } = useSelect( select => select( 'core/editor' ), [] );

	// Split into separate selectors to maintain referential equality
	const postType = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'type' ),
		[]
	);

	const tagIds = useSelect(
		select => select( 'core/editor' ).getEditedPostAttribute( 'tags' ) || [],
		[]
	);

	const postsSupportTags = useSelect(
		select => select( 'core' ).getPostType( 'post' )?.taxonomies?.includes( 'post_tag' ),
		[]
	);

	// Memoize the query object
	const query = useMemo( () => {
		if ( tagIds.length === 0 ) {
			return null;
		}
		return {
			_fields: 'id,name',
			context: 'view',
			include: tagIds.join( ',' ),
			per_page: -1,
		};
	}, [ tagIds ] );

	// Get tags with memoized query
	const tags = useSelect(
		select => {
			if ( tagIds.length === 0 ) {
				return [];
			}
			return select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag', query ) || [];
		},
		[ query, tagIds.length ]
	);

	const tagsHaveResolved = useSelect(
		select => {
			if ( tagIds.length === 0 ) {
				return true;
			}
			return select( 'core' ).hasFinishedResolution( 'getEntityRecords', [
				'taxonomy',
				'post_tag',
				query,
			] );
		},
		[ query, tagIds.length ]
	);

	// Add the related prompt tags, if we're able and they haven't been added already.
	useEffect( () => {
		if (
			// We're only interested in tagging posts as writing prompt answers.
			'post' !== postType ||
			// Make sure tag support hasn't been disabled for posts.
			! postsSupportTags ||
			// Prompt tags are only added once (they can be removed by the user, if desired).
			tagsAdded ||
			// Tags for the post have resolved.
			! tagsHaveResolved ||
			// We successfully fetched the prompt, otherwise there's no point in adding tags to the post.
			! promptId ||
			! Array.isArray( tags )
		) {
			return;
		}

		// Make sure we only try fetch prompt tag ids one time, even though the hook reruns on every component render.
		if ( promptTagRequestStatus.current === 'not-started' ) {
			// Add the prompt tags, if any are missing.
			if (
				! tags.some( t => t.name && t.name === 'dailyprompt' ) ||
				! tags.some( t => t.name && t.name === `dailyprompt-${ promptId }` )
			) {
				promptTagRequestStatus.current = 'pending';

				Promise.all( [
					findOrCreateTag( 'dailyprompt' ),
					findOrCreateTag( `dailyprompt-${ promptId }` ),
				] )
					.then( tagResponses => {
						const promptTagIds = tagResponses.map( tagResponse => tagResponse.id );
						const currentTags = getEditedPostAttribute( 'tags' ) || [];
						editPost( { tags: [ ...currentTags, ...promptTagIds ] } );
						promptTagRequestStatus.current = 'fulfilled';
					} )
					.catch( error => {
						console.error( error ); // eslint-disable-line no-console
						promptTagRequestStatus.current = 'rejected';
					} );
			} else {
				// Otherwise mark the tag request as finished.
				promptTagRequestStatus.current = 'fulfilled';
			}
		}

		if ( promptTagRequestStatus.current === 'fulfilled' ) {
			setTagsAdded( true );
		}
	}, [
		editPost,
		postsSupportTags,
		postType,
		promptId,
		promptTagRequestStatus,
		setTagsAdded,
		tags,
		tagIds,
		tagsAdded,
		tagsHaveResolved,
		getEditedPostAttribute,
	] );
}
