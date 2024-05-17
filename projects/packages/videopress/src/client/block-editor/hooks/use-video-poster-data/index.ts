/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useRef } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { pollGeneratingPosterImage, requestUpdatePosterByVideoFrame } from '../../../lib/poster';
import { getVideoPressUrl } from '../../../lib/url';
/**
 * Types
 */
import { VideoBlockAttributes } from '../../blocks/video/types';

const debug = debugFactory( 'videopress:video:use-sync-media' );

/**
 * React hook to handle video poster generation based on block attributes changes and post save events.
 *
 * @param {VideoBlockAttributes} attributes - Block attributes.
 * @returns {boolean} isGeneratingPoster    - Whether the poster image is being generated.
 */
export function useVideoPosterData( attributes: VideoBlockAttributes ) {
	// Detect when the post has been just saved.
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );

	const postHasBeenJustSaved = !! ( wasSaving && ! isSaving );

	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const prevAttributes = useRef< VideoBlockAttributes >();
	const [ isGeneratingPoster, setIsGeneratingPoster ] = useState( false );

	useEffect( () => {
		if ( ! postHasBeenJustSaved || ! prevAttributes.current ) {
			// store the very first attributes
			if ( ! prevAttributes.current ) {
				prevAttributes.current = attributes;
			}
			return;
		}

		// Check whether a video poster image needs to be generated.
		if (
			attributes?.posterData?.type === 'video-frame' &&
			attributes?.posterData?.atTime !== prevAttributes.current?.posterData?.atTime
		) {
			debug(
				'(*) %o Poster image needs to be generated %s => %s',
				attributes?.guid,
				prevAttributes.current?.posterData?.atTime,
				attributes?.posterData?.atTime
			);

			// Update the prev/current attributes.
			prevAttributes.current = attributes;

			/*
			 * Request the poster image generation.
			 * @todo: error handling and udpate generation state
			 */
			requestUpdatePosterByVideoFrame( attributes?.guid, attributes.posterData.atTime );
			debug( '(*) %o Requesting poster image generation', attributes?.guid );
			setIsGeneratingPoster( true );
		}
	}, [ postHasBeenJustSaved ] );

	useEffect( () => {
		if ( ! isGeneratingPoster ) {
			return;
		}

		// Check whether the poster image has been generated.
		( async () => {
			if ( await pollGeneratingPosterImage( attributes?.guid ) ) {
				debug( '(*) %o Poster image has been generated', attributes?.guid );
				setIsGeneratingPoster( false );

				// Refresh player to get the new poster image.
				const videoPressUrl = getVideoPressUrl( attributes.guid, attributes );
				invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
			}
		} )();
	}, [ isGeneratingPoster ] );

	return {
		isGeneratingPoster,
	};
}
