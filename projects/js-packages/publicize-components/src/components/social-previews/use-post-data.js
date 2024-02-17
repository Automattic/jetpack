import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { usePostMeta } from '../../hooks/use-post-meta';
import { getSigImageUrl } from '../generated-image-preview/utils';
import { getMediaSourceUrl, getPostImageUrl } from './utils';

/**
 * Returns the post data.
 *
 * @returns {object} The post data.
 */
export function usePostData() {
	const { attachedMedia, imageGeneratorSettings, shouldUploadAttachedMedia } = usePostMeta();

	return useSelect(
		select => {
			const { getMedia } = select( 'core' );
			const { getEditedPostAttribute, getEditedPostContent } = select( 'core/editor' );

			const featuredImageId = getEditedPostAttribute( 'featured_media' );

			// Use the featured image by default, if it's available.
			let image = featuredImageId ? getMediaSourceUrl( getMedia( featuredImageId ) ) : '';

			const sigImageUrl = imageGeneratorSettings.enabled
				? getSigImageUrl( imageGeneratorSettings.token )
				: '';
			// If we have a SIG token, use it to generate the image URL.
			if ( sigImageUrl ) {
				image = sigImageUrl;
			} else if ( attachedMedia?.[ 0 ]?.id ) {
				// If we don't have a SIG image, use the first image in the attached media.
				const [ firstMedia ] = attachedMedia;
				const isImage = firstMedia.id
					? getMedia( firstMedia.id )?.mime_type?.startsWith( 'image/' )
					: false;

				if ( isImage && firstMedia.url ) {
					image = firstMedia.url;
				}
			}

			// If we still don't have an image, try to get it from the post content.
			if ( ! image ) {
				const postImageUrl = getPostImageUrl( getEditedPostContent() );

				if ( postImageUrl ) {
					image = postImageUrl;
				}
			}

			const media = [];

			// Attach media only if "Share as a social post" option is enabled.
			if ( shouldUploadAttachedMedia ) {
				if ( sigImageUrl ) {
					media.push( {
						type: 'image/jpeg',
						url: sigImageUrl,
						alt: '',
					} );
				} else {
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
					if ( 0 === media.length && featuredImageId ) {
						const mediaDetails = getMediaDetails( featuredImageId );
						if ( mediaDetails ) {
							media.push( mediaDetails );
						}
					}
				}
			}
			return {
				title:
					getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
					getEditedPostAttribute( 'title' ),
				description:
					getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
					getEditedPostAttribute( 'excerpt' ) ||
					getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
					__( 'Visit the post for more.', 'jetpack' ),
				url: getEditedPostAttribute( 'link' ),
				image,
				media,
				initialTabName: null,
			};
		},
		[ shouldUploadAttachedMedia, attachedMedia, imageGeneratorSettings ]
	);
}
