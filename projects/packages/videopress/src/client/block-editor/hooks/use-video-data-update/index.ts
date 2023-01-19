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
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../lib/url';
import { uploadTrackForGuid } from '../../../lib/video-tracks';
import { UploadTrackDataProps } from '../../../lib/video-tracks/types';
import {
	WPComV2VideopressGetMetaEndpointResponseProps,
	WPComV2VideopressPostMetaEndpointBodyProps,
} from '../../../types';
import extractVideoChapters from '../../../utils/extract-video-chapters';
import generateChaptersFile from '../../../utils/generate-chapters-file';
import { snakeToCamel } from '../../../utils/map-object-keys-to-camel-case';
import {
	VideoBlockAttributes,
	VideoBlockSetAttributesProps,
	VideoId,
} from '../../blocks/video/types';
import useVideoData from '../use-video-data';
import { VideoDataProps } from '../use-video-data/types';
import { UseSyncMediaProps, UseSyncMediaOptionsProps, ArrangeTracksAttributesProps } from './types';

const debug = debugFactory( 'videopress:video:use-sync-media' );

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
const videoFieldsToUpdate = [
	'post_id',
	'title',
	'description',
	'privacy_setting',
	'rating',
	'allow_download',
	'display_embed',
	'is_private',
];

/*
 * Map object from video field name to block attribute name.
 * Only register those fields that have a different attribute name.
 */
const mapFieldsToAttributes = {
	privacy_setting: 'privacySetting',
	allow_download: 'allowDownload',
	display_embed: 'displayEmbed',
	is_private: 'isPrivate',
	post_id: 'id',
};

/*
 * Fields list that should invalidate the resolution of the embed (player)
 * when some of them change.
 *
 * Keep in mind some field changes
 * are handled inidrectly by the VideoPress video URL,
 * for instance, `loop`, `autoplay`, `color`, etc...
 */
const invalidateEmbedResolutionFields = [
	'title',
	'privacy_setting',
	'is_private',
	'allow_download',
	'display_embed',
];

/**
 * Re-arrange the tracks to match the block attribute format.
 * Also, check if the tracks is out of sync with the media item.
 *
 * @param {VideoDataProps} videoData        - Video data, provided by server.
 * @param {VideoBlockAttributes} attributes - Block attributes.
 * @returns {VideoBlockAttributes}            Video block attributes.
 */
function arrangeTracksAttributes(
	videoData: VideoDataProps,
	attributes: VideoBlockAttributes
): ArrangeTracksAttributesProps {
	if ( ! videoData?.tracks ) {
		return [ [], false ];
	}

	const tracks = [];
	let tracksOufOfSync = false;

	Object.keys( videoData.tracks ).forEach( kind => {
		for ( const srcLang in videoData.tracks[ kind ] ) {
			const track = videoData.tracks[ kind ][ srcLang ];
			const trackExistsInBlock = attributes.tracks.find( t => {
				return (
					t.kind === kind && t.srcLang === srcLang && t.src === track.src && t.label === track.label
				);
			} );

			if ( ! trackExistsInBlock ) {
				debug( 'Track %o is out of sync. Set tracks attr', track.src );
				tracksOufOfSync = true;
			}

			tracks.push( {
				src: track.src,
				kind,
				srcLang,
				label: track.label,
			} );
		}
	} );

	return [ tracks, tracksOufOfSync ];
}

/**
 * React hook to keep the data in-sync
 * between the media item and the block attributes.
 *
 * @param {object} attributes                - Block attributes.
 * @param {Function} setAttributes           - Block attributes setter.
 * @param {UseSyncMediaOptionsProps} options - Options.
 * @returns {UseSyncMediaProps}                Hook API object.
 */
export function useSyncMedia(
	attributes: VideoBlockAttributes,
	setAttributes: VideoBlockSetAttributesProps,
	options: UseSyncMediaOptionsProps
): UseSyncMediaProps {
	const { id, guid } = attributes;
	const { videoData, isRequestingVideoData } = useVideoData( {
		id,
		guid,
		skipRatingControl: true,
	} );

	const isSaving = useSelect( select => select( editorStore ).isSavingPost(), [] );
	const wasSaving = usePrevious( isSaving );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const [ initialState, setState ] = useState< VideoDataProps >( {} );

	const [ error, setError ] = useState( null );

	const updateInitialState = useCallback( ( data: VideoDataProps ) => {
		setState( current => ( { ...current, ...data } ) );
	}, [] );

	/*
	 * Media data => Block attributes (update)
	 *
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

		const attributesToUpdate: VideoBlockAttributes = {};

		// Build an object with video data to use for the initial state.
		const initialVideoData = videoFieldsToUpdate.reduce( ( acc, key ) => {
			if ( typeof videoData[ key ] === 'undefined' ) {
				return acc;
			}

			let videoDataValue = videoData[ key ];

			// Cast privacy_setting to number to match the block attribute type.
			if ( 'privacy_setting' === key ) {
				videoDataValue = Number( videoDataValue );
			}

			acc[ key ] = videoDataValue;
			const attrName = mapFieldsToAttributes[ key ] || snakeToCamel( key );

			if ( videoDataValue !== attributes[ attrName ] ) {
				debug(
					'%o is out of sync. Updating %o attr from %o to %o ',
					key,
					attrName,
					attributes[ attrName ],
					videoDataValue
				);
				attributesToUpdate[ attrName ] = videoDataValue;
			}
			return acc;
		}, {} );

		updateInitialState( initialVideoData );
		debug( 'Initial state: ', initialVideoData );

		if ( ! Object.keys( initialVideoData ).length ) {
			return;
		}

		// Sync video tracks if needed.
		const [ tracks, tracksOufOfSync ] = arrangeTracksAttributes( videoData, attributes );
		if ( tracksOufOfSync ) {
			attributesToUpdate.tracks = tracks;
		}

		if ( ! Object.keys( attributesToUpdate ).length ) {
			return;
		}

		debug( 'Updating attributes: ', attributesToUpdate );
		setAttributes( attributesToUpdate );
	}, [ videoData, isRequestingVideoData ] );

	const updateMediaHandler = useMediaDataUpdate( id );

	/*
	 * Block attributes => Media data (sync)
	 *
	 * Compare the current attribute values of the block
	 * with the initial state,
	 * and sync the media data if it detects changes on it
	 * (via the VideoPress API) when the post saves.
	 */
	useEffect( () => {
		if ( ! isSaving || wasSaving ) {
			return;
		}

		debug( '%o Saving post action detected', attributes?.guid );

		if ( ! attributes?.id ) {
			debug( '%o No media ID found. Impossible to sync. Bail early', attributes?.guid );
			return;
		}

		/*
		 * Filter the attributes that have changed their values,
		 * based on the initial state.
		 */
		const dataToUpdate: WPComV2VideopressPostMetaEndpointBodyProps = videoFieldsToUpdate.reduce(
			( acc, key ) => {
				const attrName = mapFieldsToAttributes[ key ] || key;
				const stateValue = initialState[ key ];
				const attrValue = attributes[ attrName ];

				if ( initialState[ key ] !== attributes[ attrName ] ) {
					debug( 'Field to sync %o: %o => %o: %o', key, stateValue, attrName, attrValue );
					acc[ key ] = attributes[ attrName ];
				}
				return acc;
			},
			{}
		);

		// When nothing to update, bail out early.
		if ( ! Object.keys( dataToUpdate ).length ) {
			return debug( 'No data to sync. Bail early' );
		}

		debug( 'Syncing data: ', dataToUpdate );

		// Sync the block attributes data with the video data
		updateMediaHandler( dataToUpdate )
			.then( () => {
				// Update local state with fresh video data.
				updateInitialState( dataToUpdate );

				// | Video Chapters feature |
				const chapters = extractVideoChapters( dataToUpdate?.description );

				if (
					options.isAutoGeneratedChapter &&
					attributes?.guid &&
					dataToUpdate?.description?.length &&
					chapters?.length
				) {
					debug( 'Auto-generated chapter detected. Processing...' );
					const track: UploadTrackDataProps = {
						label: __( 'English (auto-generated)', 'jetpack-videopress-pkg' ),
						srcLang: 'en',
						kind: 'chapters',
						tmpFile: generateChaptersFile( dataToUpdate.description ),
					};

					debug( 'Auto-generated track: %o', track );

					uploadTrackForGuid( track, attributes.guid ).then( ( src: string ) => {
						const autoGeneratedTrackIndex = attributes.tracks.findIndex(
							t => t.kind === 'chapters' && t.srcLang === 'en'
						);

						const uploadedTrack = {
							...track,
							src,
						};

						const tracks = [ ...attributes.tracks ];

						if ( autoGeneratedTrackIndex > -1 ) {
							debug( 'Updating %o auto-generated track', uploadedTrack.src );
							tracks[ autoGeneratedTrackIndex ] = uploadedTrack;
						} else {
							debug( 'Adding auto-generated %o track', uploadedTrack.src );
							tracks.push( uploadedTrack );
						}

						// Update block track attribute
						setAttributes( { tracks } );

						const videoPressUrl = getVideoPressUrl( attributes.guid, attributes );
						invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
					} );
				} else {
					const shouldInvalidateResolution = Object.keys( dataToUpdate ).filter( key =>
						invalidateEmbedResolutionFields.includes( key )
					);

					if ( shouldInvalidateResolution?.length ) {
						debug( 'Invalidate resolution because of %o', shouldInvalidateResolution.join( ', ' ) );

						const videoPressUrl = getVideoPressUrl( attributes.guid, attributes );
						invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
					}
				}
			} )
			.catch( ( updateMediaError: Error ) => {
				debug( '%o Error while syncing data: %o', attributes?.guid, updateMediaError );
				setError( updateMediaError );
			} );
	}, [
		isSaving,
		wasSaving,
		updateMediaHandler,
		updateInitialState,
		attributes,
		initialState,
		invalidateResolution,
		videoFieldsToUpdate,
	] );

	return {
		forceInitialState: updateInitialState,
		videoData,
		isRequestingVideoData,
		error,
	};
}
