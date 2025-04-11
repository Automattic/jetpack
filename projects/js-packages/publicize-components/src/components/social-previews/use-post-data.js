import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';
import { getSigImageUrl } from '../generated-image-preview/utils';
import { getMediaSourceUrl, getPostImageUrl } from './utils';

/**
 * Returns the post data.
 *
 * @return {object} The post data.
 */
export function usePostData() {
	const { attachedMedia, imageGeneratorSettings } = usePostMeta();

	const { getMedia } = useSelect( coreStore, [] );
	const { getEditedPostAttribute, getEditedPostContent } = useSelect( editorStore, [] );

	return useMemo(
		// eslint-disable-next-line no-unused-vars -- This is here temporarily to avoid prettier making the diff unreadable.
		_ => {
			const featuredImageId = getEditedPostAttribute( 'featured_media' );

			// Use the featured image by default, if it's available.
			let image = featuredImageId ? getMediaSourceUrl( getMedia( featuredImageId ) ) : '';

			const sigImageUrl = imageGeneratorSettings.enabled
				? getSigImageUrl( imageGeneratorSettings.token )
				: '';
			// If we have a SIG token, use it to generate the image URL.
			if ( sigImageUrl ) {
				image = sigImageUrl;
			}

			// If we still don't have an image, try to get it from the post content.
			if ( ! image ) {
				const postImageUrl = getPostImageUrl( getEditedPostContent() );

				if ( postImageUrl ) {
					image = postImageUrl;
				}
			}

			const media = [];

			const getMediaDetails = id => {
				const mediaItem = getMedia( id );
				if ( ! mediaItem ) {
					return null;
				}
				return {
					type: mediaItem.mime_type,
					url: getMediaSourceUrl( mediaItem ),
					alt: mediaItem.alt_text,
				};
			};

			for ( const { id } of attachedMedia ) {
				const mediaDetails = getMediaDetails( id );
				if ( mediaDetails ) {
					media.push( mediaDetails );
				}
			}

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
				initialTabName: null,
			};
		},
		[
			attachedMedia,
			getEditedPostAttribute,
			getEditedPostContent,
			getMedia,
			imageGeneratorSettings.enabled,
			imageGeneratorSettings.token,
		]
	);
}
