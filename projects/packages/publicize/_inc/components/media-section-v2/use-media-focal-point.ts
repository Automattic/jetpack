/**
 * useMediaFocalPoint
 *
 * Reads and writes a focal point on an image (attachment meta), and reports
 * whether the current user is allowed to edit that image. The point lives on
 * the attachment, not the post, so it is shared by every post using the image.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import type { FocalPoint } from '../../utils/types';

/** Attachment meta key — must match ATTACHMENT_IMAGE_FOCAL_POINT in PHP. */
export const FOCAL_POINT_META_KEY = '_jetpack_social_image_focal_point';

const DEFAULT_FOCAL_POINT: FocalPoint = { x: 0.5, y: 0.5 };

export type UseMediaFocalPoint = {
	/** The point to display: the optimistic value while saving, else the stored one. */
	value: FocalPoint;
	/** Whether the current user can edit this image (undefined while resolving). */
	canEdit: boolean | undefined;
	/** Persist a new point to the image. */
	setFocalPoint: ( point: FocalPoint ) => void;
};

/**
 * Read and write the focal point stored on an image, and report edit permission.
 *
 * @param {number} attachmentId - The image's attachment ID (0/undefined → no image).
 * @return {UseMediaFocalPoint} The focal point, edit permission, and a setter.
 */
export function useMediaFocalPoint( attachmentId: number ): UseMediaFocalPoint {
	const { storedValue, canEdit } = useSelect(
		select => {
			if ( ! attachmentId ) {
				return { storedValue: DEFAULT_FOCAL_POINT, canEdit: false };
			}
			const core = select( coreStore );
			const record = core.getEntityRecord( 'postType', 'attachment', attachmentId ) as
				| { meta?: { [ FOCAL_POINT_META_KEY ]?: FocalPoint } }
				| undefined;

			return {
				storedValue: record?.meta?.[ FOCAL_POINT_META_KEY ] ?? DEFAULT_FOCAL_POINT,
				canEdit: core.canUser( 'update', 'media', attachmentId ),
			};
		},
		[ attachmentId ]
	);

	const { saveEntityRecord } = useDispatch( coreStore );

	// The persisted store value lags the network round-trip, and FocalPointPicker
	// snaps its marker to the value prop on release — so without an optimistic value
	// the point jumps back to the old spot until the save lands. Keep the pending
	// point keyed by image so switching images falls straight back to its stored value.
	const [ pending, setPending ] = useState< { id: number; point: FocalPoint } | null >( null );
	const value = pending && pending.id === attachmentId ? pending.point : storedValue;

	const setFocalPoint = useCallback(
		( point: FocalPoint ) => {
			setPending( { id: attachmentId, point } );

			// Saves directly to the image, separate from the post's save/undo.
			Promise.resolve(
				saveEntityRecord( 'postType', 'attachment', {
					id: attachmentId,
					meta: { [ FOCAL_POINT_META_KEY ]: point },
				} )
			).catch( () => {
				// Revert the optimistic value if the save fails.
				setPending( current => ( current && current.id === attachmentId ? null : current ) );
			} );
		},
		[ attachmentId, saveEntityRecord ]
	);

	return { value, canEdit, setFocalPoint };
}
