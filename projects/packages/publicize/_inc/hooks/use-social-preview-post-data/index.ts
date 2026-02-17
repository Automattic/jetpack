import { Attachment, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';
import { getSigImageUrl } from '../../hooks/use-sig-preview/utils';
import { PostData } from './types';
import { getMediaSourceUrl, getPostImageUrl } from './utils';

/**
 * Returns the post data needed for social preview.
 *
 * @return The post data.
 */
export function useSocialPreviewPostData(): PostData {
	const { attachedMedia, imageGeneratorSettings } = usePostMeta();

	const { getEditedPostAttribute } = useSelect( editorStore, [] );

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
			const items: PostData[ 'media' ] = [];

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

	const image = useSelect(
		select => {
			const { getEntityRecord } = select( coreStore );

			const featuredImageId = select( editorStore ).getEditedPostAttribute( 'featured_media' );

			// Use the featured image by default, if it's available.
			let _image = featuredImageId
				? getMediaSourceUrl( getEntityRecord( 'postType', 'attachment', featuredImageId ) )
				: '';

			const sigImageUrl = imageGeneratorSettings.enabled
				? getSigImageUrl( imageGeneratorSettings.token )
				: '';
			// If we have a SIG token, use it to generate the image URL.
			if ( sigImageUrl ) {
				_image = sigImageUrl;
			}

			// If we still don't have an image, try to get it from the post content.
			if ( ! _image ) {
				const postImageUrl = getPostImageUrl( select( editorStore ).getEditedPostContent() );

				if ( postImageUrl ) {
					_image = postImageUrl;
				}
			}

			return _image;
		},
		[ imageGeneratorSettings.enabled, imageGeneratorSettings.token ]
	);

	return useMemo( () => {
		return {
			title: (
				getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
				getEditedPostAttribute( 'title' ) ||
				''
			).trim(),
			description: (
				getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
				getEditedPostAttribute( 'excerpt' ) ||
				getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
				__( 'Visit the post for more.', 'jetpack-publicize-pkg' ) ||
				''
			).trim(),
			url: getEditedPostAttribute( 'link' ),
			excerpt: (
				getEditedPostAttribute( 'excerpt' ) ||
				getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
				''
			).trim(),
			image,
			media,
		};
	}, [ getEditedPostAttribute, media, image ] );
}
