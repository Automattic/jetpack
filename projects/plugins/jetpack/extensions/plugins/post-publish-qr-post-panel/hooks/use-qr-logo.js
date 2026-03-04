import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * React hook that returns the optimal logo for QR code display.
 * Prioritizes site icon (favicon) over site logo, as site icons are always square
 * and render better in the small QR code center area.
 *
 * @param {object}  params                 - Hook parameters.
 * @param {boolean} params.generateDataUrl - Whether to convert the data URL to a blob. Default: false.
 * @return {object} Logo object data with dataUrl, id, mediaId, url, alt properties.
 */
export default function useQRLogo( { generateDataUrl = false } = {} ) {
	const [ dataUrl, setDataUrl ] = useState();
	const { id, mediaItemData } = useSelect( select => {
		const { canUser, getEntityRecord, getEditedEntityRecord } = select( coreStore );
		const siteSettings = getEditedEntityRecord( 'root', 'site' );
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		const canUserEdit = canUser( 'update', 'settings' );

		// Prioritize site icon (favicon) - always square, ideal for QR codes
		const siteIcon = siteSettings?.site_icon;
		const readOnlySiteIcon = siteData?.site_icon;
		const siteIconId = canUserEdit ? siteIcon : readOnlySiteIcon;

		// Fallback to site logo if no site icon
		const siteLogo = siteSettings?.site_logo;
		const readOnlyLogo = siteData?.site_logo;
		const siteLogoId = canUserEdit ? siteLogo : readOnlyLogo;

		// Use site icon if available, otherwise fall back to site logo
		const logoId = siteIconId || siteLogoId;

		const mediaItem =
			logoId &&
			select( coreStore ).getEntityRecord( 'postType', 'attachment', logoId, {
				context: 'view',
			} );

		return {
			id: logoId,
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

	// Convert image to data URL.
	image.onload = function () {
		// Create and set canvas size.
		const canvas = document.createElement( 'canvas' );
		const context = canvas.getContext( '2d' );
		canvas.height = this.naturalHeight;
		canvas.width = this.naturalWidth;

		// Paint canvas with a white background.
		context.fillStyle = 'white';
		context.lineJoin = 'round';
		context.fillRect( 0, 0, canvas.width, canvas.height );

		// Add a border/padding to the canvas, scaling the image.
		const borderWidth = canvas.width * 0.08; // 8% of the canvas width.
		context.drawImage(
			this,
			borderWidth,
			borderWidth,
			canvas.width - borderWidth * 2,
			canvas.height - borderWidth * 2
		);

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
