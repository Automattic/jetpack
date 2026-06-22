/**
 * Focal point helpers.
 *
 * The focal point of an image is stored on the attachment as post meta, so it is
 * shared by every post and network that uses the image. These helpers read and
 * validate that stored value for both the picker and the previews.
 */

import type { FocalPoint } from './types';

/** Attachment meta key — must match ATTACHMENT_IMAGE_FOCAL_POINT in PHP. */
export const FOCAL_POINT_META_KEY = '_jetpack_social_image_focal_point';

/**
 * Type guard for a valid focal point: an object with finite x/y both in 0-1.
 *
 * @param {unknown} value - The value to check.
 * @return {boolean} Whether the value is a valid focal point.
 */
const isValidFocalPoint = ( value: unknown ): value is FocalPoint => {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	const point = value as Partial< Record< keyof FocalPoint, unknown > >;

	return (
		typeof point.x === 'number' &&
		Number.isFinite( point.x ) &&
		point.x >= 0 &&
		point.x <= 1 &&
		typeof point.y === 'number' &&
		Number.isFinite( point.y ) &&
		point.y >= 0 &&
		point.y <= 1
	);
};

/**
 * Reads the focal point stored on an attachment record's meta.
 *
 * Returns `undefined` when the record is missing or has no valid stored point,
 * so previews fall back to the browser default (centered) instead of forcing a
 * point. Pass the record from `getEntityRecord( 'postType', 'attachment', id )`.
 *
 * @param {unknown} record - The attachment entity record (or undefined).
 * @return {FocalPoint | undefined} The stored focal point, or undefined.
 */
export function readFocalPointMeta( record: unknown ): FocalPoint | undefined {
	const meta = ( record as { meta?: { [ FOCAL_POINT_META_KEY ]?: unknown } } | undefined )?.meta;
	const focalPoint = meta?.[ FOCAL_POINT_META_KEY ];

	return isValidFocalPoint( focalPoint ) ? focalPoint : undefined;
}
