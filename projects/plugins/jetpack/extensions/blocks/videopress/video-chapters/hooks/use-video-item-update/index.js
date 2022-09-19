/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { usePrevious } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { uploadTrackForGuid } from '../../../tracks-editor';
import { getVideoPressUrl } from '../../../url';
import generateChaptersFile from '../../utils/generate-chapters-file';

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

export function useSyncMedia( attributes ) {
	const { id, title, description, guid, videoPressTracks } = attributes;
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const [ initialState, setState ] = useState( {} );

	const updateInitialState = useCallback( data => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	// Populate initial state when mounted
	useEffect( () => {
		setState( { title, description } );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const updateMedia = useMediaItemUpdate( id );

	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		if ( ! id ) {
			return;
		}

		const videoDataToUpdate = {};

		if ( initialState?.title !== title ) {
			videoDataToUpdate.title = title;
		}

		if ( initialState?.description !== description ) {
			videoDataToUpdate.description = description;
		}

		// Update video data (title and description)
		if ( Object.keys( videoDataToUpdate ).length ) {
			updateMedia( videoDataToUpdate ).then( () => updateInitialState( { title, description } ) );
		}

		// --- Video Chapters handling --- //
		if ( ! videoDataToUpdate?.description?.length ) {
			return;
		}

		const tracksToUpload = videoPressTracks.filter( track =>
			initialState.langsToSync?.includes( track.srcLang )
		);
		if ( ! tracksToUpload.length ) {
			return;
		}

		// Update chapters by uploading the tracks
		tracksToUpload.forEach( unuploadedTrack => {
			const track = {
				kind: 'chapters',
				label: unuploadedTrack.label,
				srcLang: unuploadedTrack.srcLang,
				tmpFile: generateChaptersFile( videoDataToUpdate?.description ),
			};

			uploadTrackForGuid( track, guid ).then( () => {
				const videoPressUrl = getVideoPressUrl( guid, attributes );

				// Once chapters udpates refresh the video player
				invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
			} );
		} );
	}, [
		isSaving,
		wasSaving,
		title,
		description,
		updateMedia,
		updateInitialState,
		attributes,
		invalidateResolution,
		id,
		guid,
		videoPressTracks,
		initialState,
	] );

	return [ updateInitialState, initialState ];
}
