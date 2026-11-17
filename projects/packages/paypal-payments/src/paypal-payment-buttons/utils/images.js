/**
 * Product images: the limits PayPal enforces and the shapes the block and the API use.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';

/**
 * Line-item images PayPal shows on one payment.
 */
export const MAX_PRODUCT_IMAGES = 5;

/**
 * Largest file PayPal takes.
 */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

/**
 * Smallest and largest side PayPal takes, in pixels.
 */
export const MIN_IMAGE_PX = 10;
export const MAX_IMAGE_PX = 9000;

/**
 * Formats PayPal takes. The server checks the same list.
 */
export const IMAGE_MIME_TYPES = [ 'image/jpeg', 'image/png', 'image/bmp', 'image/tiff' ];

/**
 * The name shown for a media library item.
 *
 * @param {object} media - A media library item as the media modal hands it over.
 * @return {string} Its file name, title, or a stand-in.
 */
export function mediaName( media ) {
	return media?.filename || media?.title || __( 'Image', 'jetpack-paypal-payments' );
}

/**
 * Why a media library item cannot go to PayPal, before it is sent.
 *
 * @param {object} media - A media library item as the media modal hands it over.
 * @return {string|null} The message, or null when the file can be sent.
 */
export function checkMediaItem( media ) {
	const name = mediaName( media );

	if ( ! IMAGE_MIME_TYPES.includes( media?.mime || media?.mime_type ) ) {
		return sprintf(
			/* translators: %s: file name */
			__( '%s is not a JPEG, PNG, BMP or TIFF image.', 'jetpack-paypal-payments' ),
			name
		);
	}

	if ( media.filesizeInBytes > MAX_IMAGE_BYTES ) {
		return sprintf(
			/* translators: %s: file name */
			__( '%s is over 12 MB.', 'jetpack-paypal-payments' ),
			name
		);
	}

	const sides = [ media.width, media.height ].filter( side => typeof side === 'number' );
	if ( sides.some( side => side < MIN_IMAGE_PX || side > MAX_IMAGE_PX ) ) {
		return sprintf(
			/* translators: 1: file name, 2: smallest side in pixels, 3: largest side in pixels */
			__( '%1$s must be between %2$d and %3$d pixels on each side.', 'jetpack-paypal-payments' ),
			name,
			MIN_IMAGE_PX,
			MAX_IMAGE_PX
		);
	}

	return null;
}

/**
 * The block's record of an image: PayPal's row for it, plus what the media library knows.
 *
 * PayPal returns no name and no thumbnail until the image is approved, so the media
 * library's stand in until then.
 *
 * @param {object} media - The media library item that was sent.
 * @param {object} row   - PayPal's row for it, from the upload.
 * @return {object} The image as the block stores it.
 */
export function imageFromUpload( media, row ) {
	return {
		assetId: row.asset_id,
		status: row.status || 'APPROVED',
		attachmentId: media.id,
		name: mediaName( media ),
		thumbnailUrl: media.sizes?.thumbnail?.url || media.url || row.thumbnail_url || '',
		url: row.url || '',
	};
}

/**
 * An image as PayPal returns it on a payment, in the block's shape.
 *
 * @param {object} image - PayPal's image: asset_id, status, url, thumbnail_url.
 * @return {object} The image as the block stores it.
 */
export function imageFromResource( image ) {
	return {
		assetId: image.asset_id ?? image.assetId ?? '',
		status: image.status || 'APPROVED',
		url: image.url ?? '',
		thumbnailUrl: image.thumbnail_url ?? image.thumbnailUrl ?? '',
	};
}

/**
 * An image as PayPal reads it on a create or update.
 *
 * @param {object}  image     - The image as the block stores it.
 * @param {boolean} isPrimary - Whether it leads the line item. Left off a variant image.
 * @return {object} asset_id, and is_primary when given.
 */
export function toApiImage( image, isPrimary ) {
	return {
		asset_id: image.assetId,
		...( typeof isPrimary === 'boolean' ? { is_primary: isPrimary } : {} ),
	};
}

/**
 * Which option group carries the images: the priced one, or else the first.
 *
 * PayPal takes variant images on its primary group only, and the save flags the
 * first group primary when none carries prices.
 *
 * @param {object} variants - The variants data.
 * @return {number} The group's index, or -1 when there are no groups.
 */
export function getImageGroupIndex( variants ) {
	const dimensions = variants?.dimensions || [];
	const primary = dimensions.findIndex( dim => dim.primary );

	if ( primary !== -1 ) {
		return primary;
	}

	return dimensions.length ? 0 : -1;
}
