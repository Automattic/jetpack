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
import { getVideoPressUrl } from '../../../../../lib/url';
import extractVideoChapters from '../../utils/extract-video-chapters';
import generateChaptersFile from '../../utils/generate-chapters-file';
import { uploadTrackForGuid } from '../../utils/tracks-editor';

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
 * @param {object} attributes - Block attributes.
 * @returns {Array} - [ forceInitialState, isSyncing ]
 */
export function useSyncMedia( attributes ) {
	const { id, title, description, guid } = attributes;
	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const [ initialState, setState ] = useState();

	const updateInitialState = useCallback( data => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	// Populate initial state when mounted
	useEffect( () => {
		setState( { title, description } );
	}, [] );

	const updateMedia = useMediaItemUpdate( id );

	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		if ( ! id ) {
			return;
		}

		const dataToUpdate = {};

		if ( initialState?.title !== title ) {
			dataToUpdate.title = title;
		}

		if ( initialState?.description !== description ) {
			dataToUpdate.description = description;
		}

		if ( ! Object.keys( dataToUpdate ).length ) {
			return;
		}

		updateMedia( dataToUpdate ).then( () => updateInitialState( { title, description } ) );

		// Video Chapters //
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

		uploadTrackForGuid( track, guid ).then( () => {
			const videoPressUrl = getVideoPressUrl( guid, attributes );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		} );
	}, [
		isSaving,
		wasSaving,
		title,
		initialState?.title,
		initialState?.description,
		description,
		updateMedia,
		updateInitialState,
		attributes,
		invalidateResolution,
		id,
		guid,
	] );

	return [ updateInitialState ];
}
