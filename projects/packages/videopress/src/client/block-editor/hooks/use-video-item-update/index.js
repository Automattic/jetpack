/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../lib/url';
import extractVideoChapters from '../../plugins/video-chapters/utils/extract-video-chapters';
import generateChaptersFile from '../../plugins/video-chapters/utils/generate-chapters-file';
import { uploadTrackForGuid } from '../../plugins/video-chapters/utils/tracks-editor';
import useVideoItem from '../use-video-item';

/**
 * Hook to update the media data by hitting the VideoPress API.
 *
 * @param {number} id - Media ID.
 * @returns {Function}  Update Promise handler.
 */
export default function useMediaItemUpdate( id ) {
	const updateMediaItem = data => {
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id, ...data },
			} )
				.then( result => {
					if ( 200 !== result?.data ) {
						return reject( result );
					}
					resolve( result );
				} )
				.catch( reject );
		} );
	};

	return updateMediaItem;
}

/**
 * React hook to keep the data in-sync
 * between the media item and the block attributes.
 *
 * @param {object} attributes        - Block attributes.
 * @param {Function} setAttributes   - Block attributes setter.
 * @param {Array} attributesToUpdate - Block attributes list to update.
 * @returns {Array}                    [ forceInitialState, isSyncing ]
 */
export function useSyncMedia( attributes, setAttributes, attributesToUpdate ) {
	const { id, guid } = attributes;
	const [ videoItem, isRequestingVideoItem ] = useVideoItem( id );

	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const [ initialState, setState ] = useState();

	const updateInitialState = useCallback( data => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	/*
	 * Populate block attributes with the media data,
	 * provided by the VideoPress API (useVideoItem hook).
	 */
	useEffect( () => {
		if ( isRequestingVideoItem ) {
			return;
		}

		if ( ! videoItem ) {
			return;
		}

		// Build the attributes object to update.
		const initialAttributesState = attributesToUpdate.reduce( ( acc, key ) => {
			acc[ key ] = videoItem[ key ];
			return acc;
		}, {} );

		if ( ! Object.keys( initialAttributesState ).length ) {
			return;
		}

		// Let's set the internal initial state.
		setState( initialAttributesState );

		// And udpate the block attribute with fresh data.
		setAttributes( initialAttributesState );
	}, [ videoItem, isRequestingVideoItem ] );

	const updateMedia = useMediaItemUpdate( id );

	/**
	 * Compare the current block attributes with the initial state,
	 * and update the media item if needed (via the VideoPress API).
	 */
	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		if ( ! attributes?.id ) {
			return;
		}

		// Compute the diff between the initial state and the current attributes
		const dataToUpdate = attributesToUpdate.reduce( ( acc, key ) => {
			if ( initialState[ key ] !== attributes[ key ] ) {
				acc[ key ] = attributes[ key ];
			}
			return acc;
		}, {} );

		// When nothing to update, bail out early.
		if ( ! Object.keys( dataToUpdate ).length ) {
			return;
		}

		updateMedia( dataToUpdate ).then( () => updateInitialState( dataToUpdate ) );

		// | Video Chapters feature |
		if ( ! attributes?.guid ) {
			return;
		}

		if ( ! dataToUpdate?.description?.length ) {
			return;
		}

		// Upload .vtt file if its description contains chapters
		const chapters = extractVideoChapters( dataToUpdate.description );
		if ( ! chapters?.length ) {
			return;
		}

		const track = {
			label: __( 'English', 'jetpack-videopress-pkg' ),
			srcLang: 'en',
			kind: 'chapters',
			tmpFile: generateChaptersFile( dataToUpdate.description ),
		};

		// Re-render video player
		uploadTrackForGuid( track, guid ).then( () => {
			const videoPressUrl = getVideoPressUrl( guid, attributes );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		} );
	}, [
		isSaving,
		wasSaving,
		updateMedia,
		updateInitialState,
		attributes,
		invalidateResolution,
		attributesToUpdate,
	] );

	return [ updateInitialState ];
}
