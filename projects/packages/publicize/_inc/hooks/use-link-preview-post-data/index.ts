import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import { getSigImageUrl } from '../../hooks/use-sig-preview/utils';
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

	const image = useSelect( select => {
		const meta = select( editorStore ).getEditedPostAttribute( 'meta' );

		const { getEntityRecord } = select( coreStore );

		const featuredImageId = select( editorStore ).getEditedPostAttribute( 'featured_media' );

		// Use the featured image by default, if it's available.
		let imageUrl = featuredImageId
			? getMediaSourceUrl( getEntityRecord( 'postType', 'attachment', featuredImageId ) )
			: '';

		const sigImageUrl = meta.jetpack_social_options?.image_generator_settings?.enabled
			? getSigImageUrl( meta.jetpack_social_options.image_generator_settings.token )
			: '';

		// If we have a SIG image, use it to generate the image URL.
		if ( sigImageUrl ) {
			imageUrl = sigImageUrl;
		}

		// If we still don't have an image, try to get it from the post content.
		if ( ! imageUrl ) {
			const postImageUrl = getPostImageUrl( select( editorStore ).getEditedPostContent() );

			if ( postImageUrl ) {
				imageUrl = postImageUrl;
			}
		}

		return imageUrl;
	}, [] );

	const { siteTitle, siteIcon } = useSelect( select => {
		const site = select( coreStore ).getSite(
			// The id param is optional
			undefined
		);

		const { getEntityRecord } = select( coreStore );

		const siteIconId = site?.site_icon;
		let siteIconUrl = '';

		if ( siteIconId ) {
			siteIconUrl = getMediaSourceUrl( getEntityRecord( 'postType', 'attachment', siteIconId ) );
		}

		return {
			siteTitle: site?.title || '',
			siteIcon: siteIconUrl,
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
			siteIcon,
			siteTitle: decodeEntities( siteTitle ),
			title: decodeEntities( title ),
			url,
		};
	}, [ description, image, siteIcon, siteTitle, title, url ] );
}
