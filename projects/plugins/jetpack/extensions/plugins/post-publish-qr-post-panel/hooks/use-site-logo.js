/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { applyFilters } from '@wordpress/hooks';

/**
 * React hook that returns the site logo data.
 *
 * @param {object} params - Hook parameters.
 * @param {boolean} params.generateDataUrl - Whether to convert the data URL to a blob. Default: false.
 * @returns {object} Site Logo object data.
 */
export default function useSiteLogo( { generateDataUrl = false } = {} ) {
	const [ dataUrl, setDataUrl ] = useState();
	const { id, mediaItemData } = useSelect( select => {
		const { canUser, getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const siteSettings = getEditedEntityRecord( 'root', 'site' );
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		const siteLogo = siteSettings?.site_logo;
		const readOnlyLogo = siteData?.site_logo;
		const canUserEdit = canUser( 'update', 'settings' );
		const siteLogoId = canUserEdit ? siteLogo : readOnlyLogo;
		const mediaItem =
			siteLogoId &&
			select( coreStore ).getMedia( siteLogoId, {
				context: 'view',
			} );

		return {
			id: siteLogoId,
			mediaItemData: mediaItem && {
				mediaId: mediaItem.id,
				url: mediaItem.source_url,
				alt: mediaItem.alt_text,
			},
		};
	}, [] );

	if ( ! id || ! mediaItemData?.url ) {
		return {};
	}

	if ( ! generateDataUrl ) {
		return { id, ...mediaItemData };
	}

	const image = new Image();

	/*
	 * Apply image crossorigin attribute to prevent CORS errors.
	 * https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#media-crossorigin
	 */
	const imgCrossOrigin = applyFilters( 'media.crossOrigin', undefined, mediaItemData.url );

	if ( typeof imgCrossOrigin === 'string' ) {
		image.crossOrigin = imgCrossOrigin;
	}

	image.onload = function () {
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		canvas.height = this.naturalHeight;
		canvas.width = this.naturalWidth;
		context.drawImage( this, 0, 0 );
		try {
			setDataUrl( canvas.toDataURL( 'image/png' ) );
		} catch ( error ) {
			/* eslint-disable no-console */
			console.warn( 'Error generating QR code extensions post-publish-qr-post-panel: ', error );
			console.warn(
				"In case it's a cross-origin issue, take a look at https://developer.wordpress.org/block-editor/reference-guides/filters/editor-filters/#media-crossorigin"
			);
			/* eslint-enable no-console */

			setDataUrl( null );
		}
	};

	image.src = mediaItemData.url;

	return { id, ...mediaItemData, dataUrl };
}
