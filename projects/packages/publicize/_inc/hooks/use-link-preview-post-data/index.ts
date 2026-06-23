import { store as coreStore, type Attachment } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { getSigImageUrl } from '../../hooks/use-sig-preview/utils';
import { readFocalPointMeta } from '../../utils/focal-point';
import { useFocalPointOverlay } from '../../utils/focal-point-overlay';
import { LinkPreviewData } from './types';
import { getMediaSourceUrl, getPostImageUrl } from './utils';

/**
 * Returns the post data needed for link preview.
 *
 * @return The post data.
 */
export function useLinkPreviewPostData(): LinkPreviewData {
	const description = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );

		return (
			getEditedPostAttribute( 'meta' )?.advanced_seo_description ||
			getEditedPostAttribute( 'excerpt' ) ||
			getEditedPostAttribute( 'content' ).split( '<!--more' )[ 0 ] ||
			__( 'Visit the post for more.', 'jetpack-publicize-pkg' ) ||
			''
		).trim();
	}, [] );

	const { image, persistedFocalPoint, featuredImageId, isFeaturedImage } = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		const { getEntityRecord } = select( coreStore );

		const featuredId = select( editorStore ).getEditedPostAttribute( 'featured_media' );

		const featuredImageRecord = featuredId
			? getEntityRecord< Attachment >( 'postType', 'attachment', featuredId )
			: undefined;

		// Use the featured image by default, if it's available.
		let imageUrl = featuredId ? getMediaSourceUrl( featuredImageRecord ?? null ) : '';

		// The focal point belongs to the featured image; it only applies while the
		// featured image is the one being shown (SIG / post-content images clear it).
		let showingFeaturedImage = !! imageUrl;
		const persisted = readFocalPointMeta( featuredImageRecord );

		const sigImageUrl = meta.jetpack_social_options?.image_generator_settings?.enabled
			? getSigImageUrl( meta.jetpack_social_options.image_generator_settings.token )
			: '';

		// If we have a SIG image, use it to generate the image URL.
		if ( sigImageUrl ) {
			imageUrl = sigImageUrl;
			showingFeaturedImage = false;
		}

		// If we still don't have an image, try to get it from the post content.
		if ( ! imageUrl ) {
			const postImageUrl = getPostImageUrl( select( editorStore ).getEditedPostContent() );

			if ( postImageUrl ) {
				imageUrl = postImageUrl;
				showingFeaturedImage = false;
			}
		}

		return {
			image: imageUrl,
			persistedFocalPoint: persisted,
			featuredImageId: featuredId,
			isFeaturedImage: showingFeaturedImage,
		};
	}, [] );

	// The live drag point wins over the saved point, but only while the
	// featured image is the one being previewed.
	const overlayPoint = useFocalPointOverlay( featuredImageId );
	const imageFocalPoint = isFeaturedImage ? overlayPoint ?? persistedFocalPoint : undefined;

	const { siteTitle, siteIcon } = useSelect( select => {
		const { getUnstableBase } = select( coreStore );
		const base = getUnstableBase( undefined );

		return {
			siteTitle: base?.name || '',
			siteIcon: base?.site_icon_url || '',
		};
	}, [] );

	const title = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );

		return (
			getEditedPostAttribute( 'meta' )?.jetpack_seo_html_title ||
			getEditedPostAttribute( 'title' ) ||
			''
		).trim();
	}, [] );

	const url = useSelect( select => {
		return select( editorStore ).getEditedPostAttribute( 'link' );
	}, [] );

	return useMemo( () => {
		return {
			description: decodeEntities( description ),
			image,
			imageFocalPoint,
			siteIcon,
			siteTitle: decodeEntities( siteTitle ),
			title: decodeEntities( title ),
			url,
		};
	}, [ description, image, imageFocalPoint, siteIcon, siteTitle, title, url ] );
}
