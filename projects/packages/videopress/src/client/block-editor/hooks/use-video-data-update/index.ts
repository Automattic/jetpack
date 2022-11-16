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
import {
	WPComV2VideopressGetMetaEndpointResponseProps,
	WPComV2VideopressPostMetaEndpointBodyProps,
} from '../../../types';
import { mapObjectKeysToCamel } from '../../../utils/map-object-keys-to-camel-case';
import {
	VideoBlockAttributes,
	VideoBlockSetAttributesProps,
	VideoId,
} from '../../blocks/video/types';
import extractVideoChapters from '../../plugins/video-chapters/utils/extract-video-chapters';
import generateChaptersFile from '../../plugins/video-chapters/utils/generate-chapters-file';
import { uploadTrackForGuid } from '../../plugins/video-chapters/utils/tracks-editor';
import { UploadTrackDataProps } from '../../plugins/video-chapters/utils/tracks-editor/types';
import useVideoData from '../use-video-data';
import { UseSyncMediaProps } from './types';

/**
 * Hook to update the media data by hitting the VideoPress API.
 *
 * @param {VideoId} id - Media ID.
 * @returns {Function}  Update Promise handler.
 */
export default function useMediaDataUpdate( id: VideoId ) {
	const updateMediaItem = data => {
		return new Promise( ( resolve, reject ) => {
			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: { id, ...data },
			} )
				.then( ( result: WPComV2VideopressGetMetaEndpointResponseProps ) => {
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

/*
 * Fields list to keep in sync with block attributes.
 */
const videoFieldsToUpdate = [ 'privacy_setting', 'rating', 'allow_download' ];

/*
 * Map object from video field name to block attribute name.
 * Only register those fields that have a different attribute name.
 */
const mapFieldsToAttributes = {
	privacy_setting: 'privacySetting',
	allow_download: 'allowDownload',
};

/**
 * React hook to keep the data in-sync
 * between the media item and the block attributes.
 *
 * @param {object} attributes      - Block attributes.
 * @param {Function} setAttributes - Block attributes setter.
 * @returns {UseSyncMediaProps}      Hook API object.
 */
export function useSyncMedia(
	attributes: VideoBlockAttributes,
	setAttributes: VideoBlockSetAttributesProps
): UseSyncMediaProps {
	const { id, guid } = attributes;
	const { videoData, isRequestingVideoData } = useVideoData( id );

	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const [ initialState, setState ] = useState( {} );

	const updateInitialState = useCallback( data => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	/*
	 * Populate block attributes with the media data,
	 * provided by the VideoPress API (useVideoData hook),
	 * when the block is mounted.
	 */
	useEffect( () => {
		if ( isRequestingVideoData ) {
			return;
		}

		if ( ! videoData || Object.keys( videoData ).length === 0 ) {
			return;
		}

		// Build an object with video data to use for the initial state.
		const initialVideoData = videoFieldsToUpdate.reduce( ( acc, key ) => {
			acc[ key ] = videoData[ key ];
			return acc;
		}, {} );

		if ( ! Object.keys( initialVideoData ).length ) {
			return;
		}

		// Let's set the internal initial state...
		setState( initialVideoData );

		// ...and udpate the block attributes with fresh data.
		const initialAttributesValues = mapObjectKeysToCamel( initialVideoData, true );

		// Cast/tweak response body => block attributes.
		if ( typeof initialAttributesValues.allowDownload !== 'undefined' ) {
			initialAttributesValues.allowDownload = !! initialAttributesValues.allowDownload;
		}

		setAttributes( initialAttributesValues );
	}, [ videoData, isRequestingVideoData ] );

	const updateMediaHandler = useMediaDataUpdate( id );

	/*
	 * Compare the current attribute values of the block
	 * with the initial state,
	 * and update the media data if it detects changes on it
	 * (via the VideoPress API) when the post saves.
	 */
	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		if ( ! attributes?.id ) {
			return;
		}

		/*
		 * Filter the attributes that have changed their values,
		 * based on the initial state.
		 */
		const dataToUpdate: WPComV2VideopressPostMetaEndpointBodyProps = videoFieldsToUpdate.reduce(
			( acc, key ) => {
				const attrName = mapFieldsToAttributes[ key ] || key;

				if ( initialState[ key ] !== attributes[ attrName ] ) {
					acc[ key ] = attributes[ attrName ];
				}
				return acc;
			},
			{}
		);

		// When nothing to update, bail out early.
		if ( ! Object.keys( dataToUpdate ).length ) {
			return;
		}

		// Sync the block attributes data with the video data
		updateMediaHandler( dataToUpdate ).then( () => {
			// Update local state with fresh video data.
			updateInitialState( dataToUpdate );

			// Re-render video player once the data has been updated.
			const videoPressUrl = getVideoPressUrl( guid, attributes );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		} );

		// | Video Chapters feature |
		if ( attributes?.guid && dataToUpdate?.description?.length ) {
			// Upload .vtt file if its description contains chapters
			const chapters = extractVideoChapters( dataToUpdate.description );
			if ( chapters?.length ) {
				const track: UploadTrackDataProps = {
					label: __( 'English', 'jetpack-videopress-pkg' ),
					srcLang: 'en',
					kind: 'chapters',
					tmpFile: generateChaptersFile( dataToUpdate.description ),
				};

				uploadTrackForGuid( track, guid ).then( ( src: string ) => {
					// Update block track attribute
					setAttributes( {
						tracks: [
							{
								label: track.label,
								srcLang: track.srcLang,
								kind: track.kind,
								src,
							},
						],
					} );
				} );
			}
		}

		// Re-render video player
		const videoPressUrl = getVideoPressUrl( guid, attributes );
		invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
	}, [
		isSaving,
		wasSaving,
		updateMediaHandler,
		updateInitialState,
		attributes,
		invalidateResolution,
		videoFieldsToUpdate,
	] );

	return {
		forceInitialState: updateInitialState,
		videoData,
		isRequestingVideoData,
	};
}
