/**
 * useMediaFocalPoint
 *
 * Reads and writes a focal point on an image (attachment meta), and reports
 * whether the current user is allowed to edit that image. The point lives on
 * the attachment, not the post, so it is shared by every post using the image.
 */

import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo } from '@wordpress/element';
import { FOCAL_POINT_META_KEY, readFocalPointMeta } from '../../utils/focal-point';
import {
	clearFocalPointOverlay,
	setFocalPointOverlay,
	useFocalPointOverlay,
} from '../../utils/focal-point-overlay';
import type { FocalPoint } from '../../utils/types';

const DEFAULT_FOCAL_POINT: FocalPoint = { x: 0.5, y: 0.5 };

export type UseMediaFocalPoint = {
	/** The point to display: the live overlay if set, else the stored one. */
	value: FocalPoint;
	/** Whether the current user can edit this image (undefined while resolving). */
	canEdit: boolean | undefined;
	/** Show a point live (e.g. while dragging) without persisting it. */
	setPreviewFocalPoint: ( point: FocalPoint ) => void;
	/** Persist a new point to the image. */
	setFocalPoint: ( point: FocalPoint ) => void;
};

/**
 * Read and write the focal point stored on an image, and report edit permission.
 *
 * @param {number} attachmentId - The image's attachment ID (0/undefined → no image).
 * @return {UseMediaFocalPoint} The focal point, edit permission, and setters.
 */
export function useMediaFocalPoint( attachmentId: number ): UseMediaFocalPoint {
	const { storedValue, canEdit } = useSelect(
		select => {
			if ( ! attachmentId ) {
				return { storedValue: DEFAULT_FOCAL_POINT, canEdit: false };
			}
			const core = select( coreStore );
			const storedFocalPoint = readFocalPointMeta(
				core.getEntityRecord( 'postType', 'attachment', attachmentId )
			);

			return {
				storedValue: storedFocalPoint ?? DEFAULT_FOCAL_POINT,
				canEdit: core.canUser( 'update', 'media', attachmentId ),
			};
		},
		[ attachmentId ]
	);

	// The live overlay wins while the user is adjusting the point; otherwise the
	// persisted value is shown.
	const overlayPoint = useFocalPointOverlay( attachmentId );
	const value = overlayPoint ?? storedValue;

	const { saveEntityRecord } = useDispatch( coreStore );

	const setPreviewFocalPoint = useCallback(
		( point: FocalPoint ) => {
			setFocalPointOverlay( attachmentId, point );
		},
		[ attachmentId ]
	);

	useEffect( () => () => clearFocalPointOverlay( attachmentId ), [ attachmentId ] );

	const setFocalPoint = useCallback(
		( point: FocalPoint ) => {
			if ( ! attachmentId ) {
				return;
			}

			// Keep showing the point optimistically while the save is in flight.
			setFocalPointOverlay( attachmentId, point );

			// Saves directly to the image, separate from the post's save/undo.
			Promise.resolve(
				saveEntityRecord(
					'postType',
					'attachment',
					{ id: attachmentId, meta: { [ FOCAL_POINT_META_KEY ]: point } },
					{ throwOnError: true }
				)
			)
				.catch( () => {
					// Swallow; clearing below reverts to the persisted value.
				} )
				.finally( () => {
					clearFocalPointOverlay( attachmentId, point );
				} );
		},
		[ attachmentId, saveEntityRecord ]
	);

	return useMemo(
		() => ( { value, canEdit, setPreviewFocalPoint, setFocalPoint } ),
		[ value, canEdit, setPreviewFocalPoint, setFocalPoint ]
	);
}
