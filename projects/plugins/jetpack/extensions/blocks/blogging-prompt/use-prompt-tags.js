import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
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

export function usePromptTags( promptId, tagsAdded, setAttributes ) {
	const { editPost } = useDispatch( 'core/editor' );

	// Get the tags for the post.
	const { tags, tagIds, tagsHaveResolved } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getEntityRecords, hasFinishedResolution } = select( 'core' );
		const _termIds = getEditedPostAttribute( 'tags' );

		const query = {
			_fields: 'id,name',
			context: 'view',
			include: _termIds?.join( ',' ),
			per_page: -1,
		};

		return {
			tagIds: _termIds,
			tags: _termIds && _termIds.length ? getEntityRecords( 'taxonomy', 'post_tag', query ) : [],
			tagsHaveResolved:
				_termIds && _termIds.length
					? hasFinishedResolution( 'getEntityRecords', [ 'taxonomy', 'post_tag', query ] )
					: true,
		};
	}, [] );

	// Add the related prompt tags, if they haven't been added already.
	useEffect( () => {
		if ( tagsAdded || ! tagsHaveResolved || ! promptId || ! Array.isArray( tags ) ) {
			return;
		}

		if ( ! tags.some( tag => tag.name && 'dailyprompt' === tag.name ) ) {
			findOrCreateTag( 'dailyprompt' ).then( tag => {
				editPost( { tags: [ ...tagIds, tag.id ] } );
			} );
		} else if ( ! tags.some( tag => tag.name && `dailyprompt-${ promptId }` === tag.name ) ) {
			findOrCreateTag( `dailyprompt-${ promptId }` ).then( tag => {
				editPost( { tags: [ ...tagIds, tag.id ] } );
			} );
		} else {
			setAttributes( { tagsAdded: true } );
		}
	}, [ editPost, promptId, setAttributes, tagsAdded, tagsHaveResolved, tags, tagIds ] );
}
