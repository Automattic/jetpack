import { parseHyperlinks } from '@automattic/social-previews';
import { Attachment, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { useMemo } from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';
import { useLinkPreviewPostData } from '../use-link-preview-post-data';
import { getMediaSourceUrl } from '../use-link-preview-post-data/utils';
import { PostPreviewData } from './types';

/**
 * Returns the post data needed for social preview.
 *
 * @return The post data.
 */
export function useSocialPreviewPostData(): PostPreviewData {
	const { attachedMedia } = usePostMeta();
	const linkPreviewData = useLinkPreviewPostData();

	// Prepare a comma-separated list of media IDs to fetch.
	const mediaIdsStr = attachedMedia
		.map( item => item.id )
		.filter( Boolean )
		.join( ',' );

	// Pre-fetch media items from the store.
	const mediaItems = useSelect(
		select => {
			let items: Array< Attachment >;

			// Avoid fetching if there are no media IDs.
			if ( mediaIdsStr.length ) {
				items = select( coreStore ).getEntityRecords( 'postType', 'attachment', {
					include: mediaIdsStr,
				} );
			}

			return items || [];
		},
		[ mediaIdsStr ]
	);

	const media = useMemo(
		// This is here to avoid mangled diff.
		() => {
			const items: PostPreviewData[ 'media' ] = [];

			for ( const item of attachedMedia ) {
				// It can be a SIG (Social Image Generator) image allowed to be attached without an ID.
				if ( ! item.id && item.url ) {
					items.push( {
						type: item.type || 'image/jpeg',
						url: item.url,
						alt: '',
					} );
				} else {
					// Otherwise, fetch the media details from the store.
					const mediaItem = mediaItems.find( $item => $item.id === item.id );

					if ( mediaItem ) {
						items.push( {
							type: mediaItem.mime_type,
							url: getMediaSourceUrl( mediaItem ),
							alt: mediaItem.alt_text,
						} );
					}
				}
			}

			return items;
		},
		[ attachedMedia, mediaItems ]
	);

	const excerpt = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );

		return decodeEntities(
			(
				getEditedPostAttribute( 'excerpt' ) ||
				getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
				''
			).trim()
		);
	}, [] );

	const content = useSelect( select => select( editorStore ).getEditedPostContent(), [] );

	// Editor hyperlinks are read from the full serialized content (which keeps
	// the `<a>` tags) rather than the excerpt/content attribute, which is already
	// HTML-stripped. The DOM parser decodes entities, so the anchor text matches
	// the decoded body text the previews render.
	const hyperlinks = useMemo( () => parseHyperlinks( content ), [ content ] );

	return useMemo( () => {
		return {
			...linkPreviewData,
			excerpt,
			hyperlinks,
			media,
		};
	}, [ hyperlinks, excerpt, linkPreviewData, media ] );
}
