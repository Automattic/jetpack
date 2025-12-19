import { store as coreStore } from '@wordpress/core-data';
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

	const media = useSelect(
		select => {
			const { getEntityRecord } = select( coreStore );

			const items = [];

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
					const mediaItem = getEntityRecord( 'postType', 'attachment', item.id );

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
		[ attachedMedia ]
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
				__( 'Visit the post for more.', 'jetpack-publicize-components' ) ||
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
