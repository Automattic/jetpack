/**
 * Send media library images to PayPal and hand back the block's record of each.
 *
 * @package
 */

import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { API_BASE } from '../utils/api-base';
import { checkMediaItem, imageFromUpload, mediaName } from '../utils/images';
import { getUserFriendlyError } from '../utils/validation';

// Images this editor uploaded and has not seen on a saved payment, so removing one
// from the form can delete it at PayPal rather than leave it orphaned.
const unattached = new Set();

/**
 * Forget which images were uploaded here. Tests start clean with this.
 */
export function forgetUploadedImages() {
	unattached.clear();
}

/**
 * Delete an image at PayPal if this editor uploaded it and no save has taken it.
 *
 * Best effort: an image a save did attach in the meantime answers 422, which is
 * the right outcome, and the next update detaches and deletes it instead.
 *
 * @param {string} assetId - The image.
 */
export function releaseImage( assetId ) {
	if ( ! unattached.has( assetId ) ) {
		return;
	}
	unattached.delete( assetId );
	apiFetch( {
		path: `${ API_BASE }/images`,
		method: 'DELETE',
		data: { asset_id: assetId },
	} ).catch( () => {} );
}

/**
 * Upload media library images to PayPal.
 *
 * Files the media library can already rule out never go: the message says why.
 * The rest are sent in one request, and PayPal answers per file, so one bad file
 * does not stop the others.
 *
 * @param {Function} onUploaded - Called with the block's record of each image PayPal took.
 * @return {object} upload( mediaItems, limit ), the items in flight, the refusal messages, and clearErrors().
 */
export function useImageUpload( onUploaded ) {
	const [ pending, setPending ] = useState( [] );
	const [ errors, setErrors ] = useState( [] );

	const upload = useCallback(
		async ( mediaItems, limit ) => {
			const items = ( Array.isArray( mediaItems ) ? mediaItems : [ mediaItems ] ).slice( 0, limit );
			const refused = [];
			const accepted = [];
			items.forEach( media => {
				const why = checkMediaItem( media );
				if ( why ) {
					refused.push( why );
				} else {
					accepted.push( media );
				}
			} );
			setErrors( refused );

			if ( accepted.length === 0 ) {
				return;
			}
			setPending( accepted );

			try {
				const response = await apiFetch( {
					path: `${ API_BASE }/images`,
					method: 'POST',
					data: { attachment_ids: accepted.map( media => media.id ) },
				} );
				const rows = Array.isArray( response?.images ) ? response.images : [];
				const taken = [];
				const failed = [];

				accepted.forEach( media => {
					const row = rows.find( r => r.attachment_id === media.id );
					if ( row?.asset_id ) {
						unattached.add( row.asset_id );
						taken.push( imageFromUpload( media, row ) );
					} else {
						failed.push(
							row?.error?.message ||
								sprintf(
									/* translators: %s: file name */
									__( 'PayPal did not accept %s.', 'jetpack-paypal-payments' ),
									mediaName( media )
								)
						);
					}
				} );

				if ( taken.length ) {
					onUploaded( taken );
				}
				if ( failed.length ) {
					setErrors( current => [ ...current, ...failed ] );
				}
			} catch ( err ) {
				setErrors( current => [ ...current, getUserFriendlyError( err ) ] );
			} finally {
				setPending( [] );
			}
		},
		[ onUploaded ]
	);

	const clearErrors = useCallback( () => setErrors( [] ), [] );

	return { upload, pending, errors, clearErrors };
}
