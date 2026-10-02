/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { pollGeneratingPosterImage, requestUpdatePosterByVideoFrame } from '../../../lib/poster';
import { getVideoPressUrl } from '../../../lib/url';
/**
 * Types
 */
import type { VideoBlockAttributes } from '../../blocks/video/types';

/**
 * Generate a video poster after saving a selected frame, and allow failed attempts to be retried.
 *
 * @param {VideoBlockAttributes} attributes - Block attributes.
 * @return {object} Poster generation state, error message, and retry callback.
 */
export function useVideoPosterData( attributes: VideoBlockAttributes ) {
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );
	const { invalidateResolution } = useDispatch( coreStore );
	const prevAttributes = useRef( attributes );
	const pendingRequest = useRef< object | null >( null );
	const [ isGeneratingPoster, setIsGeneratingPoster ] = useState( false );
	const [ posterError, setPosterError ] = useState< string | null >( null );

	useEffect( () => {
		prevAttributes.current = attributes;
		setIsGeneratingPoster( false );
		setPosterError( null );

		// Ignore results for a video that has been replaced or a block that has been removed.
		return () => {
			pendingRequest.current = null;
		};
	}, [ attributes.guid ] );

	const generatePoster = useCallback( async () => {
		if (
			pendingRequest.current ||
			! attributes.guid ||
			attributes.posterData?.type !== 'video-frame'
		) {
			return;
		}

		const request = {};
		pendingRequest.current = request;
		setPosterError( null );
		setIsGeneratingPoster( true );

		try {
			await requestUpdatePosterByVideoFrame( attributes.guid, attributes.posterData.atTime );
			if ( pendingRequest.current !== request ) {
				return;
			}

			await pollGeneratingPosterImage( attributes.guid );
			if ( pendingRequest.current !== request ) {
				return;
			}

			// Only mark the frame as generated once the entire operation succeeds.
			prevAttributes.current = attributes;
			const videoPressUrl = getVideoPressUrl( attributes.guid, attributes );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		} catch ( error ) {
			if ( pendingRequest.current !== request ) {
				return;
			}

			const missingAttachment =
				error &&
				typeof error === 'object' &&
				'code' in error &&
				error.code === 'videopress_attachment_not_found';
			setPosterError(
				missingAttachment
					? __(
							'This video could not be found in the Media Library. Restore it from the trash, if available, and try again.',
							'jetpack-videopress-pkg'
						)
					: _x(
							'Could not generate the video poster image. Please try again.',
							'', // Keep the minifier from merging these translation calls.
							'jetpack-videopress-pkg'
						)
			);
		} finally {
			if ( pendingRequest.current === request ) {
				pendingRequest.current = null;
				setIsGeneratingPoster( false );
			}
		}
	}, [ attributes, invalidateResolution ] );

	useEffect( () => {
		if (
			postHasBeenJustSaved &&
			attributes.posterData?.type === 'video-frame' &&
			( attributes.posterData.atTime !== prevAttributes.current.posterData?.atTime ||
				prevAttributes.current.posterData?.type !== 'video-frame' )
		) {
			generatePoster();
		}
	}, [ postHasBeenJustSaved, attributes, generatePoster ] );

	return {
		isGeneratingPoster,
		posterError,
		retryPosterGeneration: generatePoster,
	};
}
