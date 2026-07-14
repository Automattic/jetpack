/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { fetchVideoItem } from '../fetch-video-item';
import getMediaToken from '../get-media-token';
import { DeleteTrackDataProps, UploadTrackDataProps } from './types';
/**
 * Types
 */
import type {
	trackKindOptionProps,
	TrackProcessingStatus,
	TrackSource,
	VideoTextTrack,
} from './types';
import type { VideoGUID } from '../../block-editor/blocks/video/types';
import type { VideoTrackResponseBodyProps, VideoTracksResponseBodyProps } from '../../types';
import type { MediaTokenProps } from '../get-media-token/types';

export const TRACK_KIND_OPTIONS = [
	'subtitles',
	'captions',
	'descriptions',
	'chapters',
	'metadata',
] as const;

export const CAPTION_FORMAT_MIME_TYPES: Record< string, string > = {
	'.vtt': 'text/vtt',
	'.srt': 'application/x-subrip',
	'.sbv': 'text/plain',
	'.sub': 'text/plain',
	'.mpsub': 'text/plain',
	'.lrc': 'text/plain',
	'.smi': 'application/smil+xml',
	'.sami': 'application/smil+xml',
	'.rt': 'text/vnd.rn-realtext',
	'.ttml': 'application/ttml+xml',
	'.dfxp': 'application/ttml+xml',
};

export const SUPPORTED_CAPTION_FORMATS = Object.keys( CAPTION_FORMAT_MIME_TYPES );

/**
 * Type guard for a valid track kind option.
 *
 * @param {string} kind - Value to check.
 * @return {boolean} Whether the value is one of the supported track kinds.
 */
const isTrackKindOption = ( kind: string ): kind is trackKindOptionProps =>
	TRACK_KIND_OPTIONS.includes( kind as trackKindOptionProps );

const TRACK_PROCESSING_STATUSES: readonly TrackProcessingStatus[] = [
	'ready',
	'serving',
	'processing',
	'syncing',
	'failed',
];

const TRACK_SOURCES: readonly TrackSource[] = [ 'asr', 'manual' ];

type TrackFallback = Pick< VideoTextTrack, 'kind' | 'srcLang' | 'label' > &
	Partial< VideoTextTrack >;

/**
 * Coerce an API response value to a string, tolerating numeric values sent by
 * some endpoints in place of strings.
 *
 * @param {unknown} value - Raw value from an API response.
 * @return {string|undefined} The value as a string, or undefined when it can't be coerced.
 */
const maybeString = ( value: unknown ): string | undefined => {
	if ( typeof value === 'string' ) {
		return value;
	}

	if ( typeof value === 'number' ) {
		return String( value );
	}

	return undefined;
};

/**
 * Coerce an API response value to a boolean, tolerating the `"true"`/`"false"`
 * strings some endpoints send in place of real booleans.
 *
 * @param {unknown} value - Raw value from an API response.
 * @return {boolean|undefined} The value as a boolean, or undefined when it can't be coerced.
 */
const maybeBoolean = ( value: unknown ): boolean | undefined => {
	if ( typeof value === 'boolean' ) {
		return value;
	}

	if ( typeof value === 'string' ) {
		if ( value === 'true' ) {
			return true;
		}

		if ( value === 'false' ) {
			return false;
		}
	}

	return undefined;
};

/**
 * Coerce an API response value to a known track processing status.
 *
 * @param {unknown} value - Raw value from an API response.
 * @return {TrackProcessingStatus|undefined} The status, or undefined when it isn't a recognized value.
 */
const maybeTrackStatus = ( value: unknown ): TrackProcessingStatus | undefined => {
	const status = maybeString( value );
	return status && TRACK_PROCESSING_STATUSES.includes( status as TrackProcessingStatus )
		? ( status as TrackProcessingStatus )
		: undefined;
};

/**
 * Coerce an API response value to a known track source.
 *
 * @param {unknown} value - Raw value from an API response.
 * @return {TrackSource|undefined} The source, or undefined when it isn't a recognized value.
 */
const maybeTrackSource = ( value: unknown ): TrackSource | undefined => {
	const source = maybeString( value );
	return source && TRACK_SOURCES.includes( source as TrackSource )
		? ( source as TrackSource )
		: undefined;
};

/**
 * Remove keys whose value is undefined from an object, so spreading a
 * normalized track over a fallback doesn't clobber good fallback values.
 *
 * @param {T} value - Object to strip undefined values from.
 * @return {T} The object without its undefined-valued keys.
 */
const withoutUndefinedValues = < T extends object >( value: T ): T => {
	const output = {} as T;
	( Object.keys( value ) as Array< keyof T > ).forEach( key => {
		if ( value[ key ] !== undefined ) {
			output[ key ] = value[ key ];
		}
	} );

	return output;
};

/**
 * Read a track's ID, tolerating the `track_id` key some API responses use
 * instead of `id`.
 *
 * @param {object} track - Track-like object from a track list or API response.
 * @return {string|number|undefined} The track ID, or undefined when absent.
 */
const getTrackId = ( track?: Partial< VideoTextTrack | VideoTrackResponseBodyProps > ) =>
	track?.id ?? ( track as VideoTrackResponseBodyProps | undefined )?.track_id;

/**
 * Read a track's source language, trying every key name used across API
 * responses before falling back to a caller-supplied value.
 *
 * @param {VideoTrackResponseBodyProps} track           - Track from an API response.
 * @param {string}                      fallbackSrcLang - Value to use when the track has none.
 * @return {string|undefined} The source language, or undefined when it can't be determined.
 */
const getTrackSrcLang = (
	track: VideoTrackResponseBodyProps,
	fallbackSrcLang?: string
): string | undefined =>
	maybeString( track.srcLang ) ||
	maybeString( track.src_lang ) ||
	maybeString( track.srclang ) ||
	maybeString( track.language ) ||
	fallbackSrcLang;

/**
 * Read a track's file URL, trying every key name used across API responses
 * before falling back to a caller-supplied value.
 *
 * @param {VideoTrackResponseBodyProps} track       - Track from an API response.
 * @param {string}                      fallbackSrc - Value to use when the track has none.
 * @return {string} The track's file URL, or an empty string when it can't be determined.
 */
const getTrackSrc = ( track: VideoTrackResponseBodyProps, fallbackSrc?: string ) =>
	maybeString( track.src ) ||
	maybeString( track.url ) ||
	maybeString( track.download_url ) ||
	maybeString( track.downloadUrl ) ||
	fallbackSrc ||
	'';

/**
 * Normalize a single track from an API response into the flat
 * `VideoTextTrack` shape, filling gaps from a fallback when the response
 * omits fields the caller already knows (e.g. kind/language from the request).
 *
 * @param {VideoTrackResponseBodyProps} track    - Track from an API response.
 * @param {Partial<TrackFallback>}      fallback - Known values to fall back to.
 * @return {VideoTextTrack|null} The normalized track, or null when it lacks a valid kind or language.
 */
const normalizeVideoTextTrack = (
	track: VideoTrackResponseBodyProps,
	fallback?: Partial< TrackFallback >
): VideoTextTrack | null => {
	const kindValue = maybeString( track.kind ) || fallback?.kind;
	if ( ! kindValue || ! isTrackKindOption( kindValue ) ) {
		return null;
	}

	const srcLang = getTrackSrcLang( track, fallback?.srcLang );
	if ( ! srcLang ) {
		return null;
	}

	return withoutUndefinedValues< VideoTextTrack >( {
		id: getTrackId( track ) ?? fallback?.id,
		src: getTrackSrc( track, fallback?.src ),
		kind: kindValue,
		srcLang,
		label: maybeString( track.label ) || fallback?.label || '',
		source: maybeTrackSource( track.source ) ?? fallback?.source,
		status: maybeTrackStatus( track.status ) ?? fallback?.status,
		isAutoGenerated:
			maybeBoolean( track.is_auto_generated ) ??
			maybeBoolean( track.isAutoGenerated ) ??
			fallback?.isAutoGenerated,
		isAutoSynced:
			maybeBoolean( track.is_auto_synced ) ??
			maybeBoolean( track.isAutoSynced ) ??
			fallback?.isAutoSynced,
		isDraft: maybeBoolean( track.is_draft ) ?? maybeBoolean( track.isDraft ) ?? fallback?.isDraft,
		failureReason:
			maybeString( track.failure_reason ) ||
			maybeString( track.failureReason ) ||
			fallback?.failureReason,
		downloadUrl:
			maybeString( track.download_url ) ||
			maybeString( track.downloadUrl ) ||
			fallback?.downloadUrl,
	} );
};

/**
 * Type guard for a non-null object, used to safely inspect API responses
 * whose shape isn't guaranteed.
 *
 * @param {unknown} value - Value to check.
 * @return {boolean} Whether the value is a non-null object.
 */
const isObject = ( value: unknown ): value is Record< string, unknown > =>
	typeof value === 'object' && value !== null;

/**
 * Whether a response object carries track-identifying data (a file URL or an
 * ID). Guards against error envelopes that would otherwise "normalize" into a
 * track built purely from fallback values.
 *
 * @param {VideoTrackResponseBodyProps} track - Track-like object from an API response.
 * @return {boolean} Whether the object identifies an actual stored track.
 */
const hasTrackIdentifyingData = ( track: VideoTrackResponseBodyProps ): boolean =>
	getTrackId( track ) !== undefined || !! getTrackSrc( track );

/**
 * Unwrap a track (or tracks list) nested under a `tracks`, `data`, or `track`
 * key, the shapes the VideoPress API's endpoints wrap responses in.
 *
 * @param {object} response - API response object to unwrap.
 * @return {unknown} The nested value, or null when the response doesn't nest one.
 */
const getTracksFromResponseObject = ( response: Record< string, unknown > ): unknown | null => {
	if ( 'tracks' in response ) {
		return response.tracks;
	}

	if ( 'data' in response ) {
		return response.data;
	}

	if ( 'track' in response ) {
		return response.track;
	}

	return null;
};

/**
 * Merge a normalized track over a fallback, preferring the track's own
 * values but keeping the fallback's wherever the track is missing them.
 *
 * @param {Partial<VideoTextTrack>} track    - Normalized track values.
 * @param {TrackFallback}           fallback - Known values to fall back to.
 * @return {VideoTextTrack} The merged track.
 */
const mergeTrackWithFallback = (
	track: Partial< VideoTextTrack >,
	fallback: TrackFallback
): VideoTextTrack =>
	withoutUndefinedValues< VideoTextTrack >( {
		id: track.id ?? fallback.id,
		kind: track.kind ?? fallback.kind,
		srcLang: track.srcLang ?? fallback.srcLang,
		label: track.label || fallback.label,
		src: track.src || fallback.src || '',
		source: track.source || fallback.source,
		status: track.status || fallback.status,
		isAutoGenerated: track.isAutoGenerated ?? fallback.isAutoGenerated,
		isAutoSynced: track.isAutoSynced ?? fallback.isAutoSynced,
		isDraft: track.isDraft ?? fallback.isDraft,
		failureReason: track.failureReason || fallback.failureReason,
		downloadUrl: track.downloadUrl || fallback.downloadUrl,
	} );

/**
 * Normalize a track API response of any shape (a single track, a nested
 * track/tracks wrapper, an array, or the grouped-by-kind-and-language shape)
 * into a single `VideoTextTrack`, filling gaps from caller-known values.
 *
 * @param {unknown}       response - Raw API response.
 * @param {TrackFallback} fallback - Known values to fall back to.
 * @return {VideoTextTrack|null} The normalized track, or null when the response contains nothing track-like.
 */
export const normalizeVideoTextTrackResponse = (
	response: unknown,
	fallback: TrackFallback
): VideoTextTrack | null => {
	if ( isObject( response ) && ! Array.isArray( response ) ) {
		const nestedTrack = getTracksFromResponseObject( response );
		if (
			isObject( nestedTrack ) &&
			! Array.isArray( nestedTrack ) &&
			hasTrackIdentifyingData( nestedTrack as VideoTrackResponseBodyProps )
		) {
			const normalizedNestedTrack = normalizeVideoTextTrack(
				nestedTrack as VideoTrackResponseBodyProps,
				fallback
			);
			if ( normalizedNestedTrack ) {
				return normalizedNestedTrack;
			}
		}

		if ( hasTrackIdentifyingData( response as VideoTrackResponseBodyProps ) ) {
			const normalizedResponseTrack = normalizeVideoTextTrack(
				response as VideoTrackResponseBodyProps,
				fallback
			);
			if ( normalizedResponseTrack ) {
				return normalizedResponseTrack;
			}
		}
	}

	const flattenedTracks = flattenVideoTracks( response as VideoTracksResponseBodyProps );
	const normalizedTrack =
		flattenedTracks.find(
			track => track.kind === fallback.kind && track.srcLang === fallback.srcLang
		) ?? flattenedTracks[ 0 ];

	if ( normalizedTrack ) {
		return mergeTrackWithFallback( normalizedTrack, fallback );
	}

	if ( typeof response === 'string' && response ) {
		return mergeTrackWithFallback( { src: response }, fallback );
	}

	return null;
};

/**
 * Convert the VideoPress API's nested track response into the flat track list
 * used by the block and caption manager UI.
 *
 * @param tracks - VideoPress API track response.
 * @return Flat text track list.
 */
export function flattenVideoTracks( tracks?: VideoTracksResponseBodyProps ): VideoTextTrack[] {
	if ( ! tracks ) {
		return [];
	}

	if ( Array.isArray( tracks ) ) {
		return tracks
			.map( track => normalizeVideoTextTrack( track ) )
			.filter( ( track ): track is VideoTextTrack => !! track );
	}

	if ( ! isObject( tracks ) ) {
		return [];
	}

	const nestedTracks = getTracksFromResponseObject( tracks );
	if ( nestedTracks ) {
		return flattenVideoTracks( nestedTracks as VideoTracksResponseBodyProps );
	}

	const singleTrack = normalizeVideoTextTrack( tracks as VideoTrackResponseBodyProps );
	if ( singleTrack ) {
		return [ singleTrack ];
	}

	const flattenedTracks: VideoTextTrack[] = [];
	Object.keys( tracks ).forEach( kind => {
		if ( ! isTrackKindOption( kind ) ) {
			return;
		}

		const tracksForKind = tracks[ kind ];
		if ( ! isObject( tracksForKind ) ) {
			return;
		}

		Object.keys( tracksForKind ).forEach( srcLang => {
			const track = tracksForKind[ srcLang ];
			if ( ! isObject( track ) ) {
				return;
			}

			const normalizedTrack = normalizeVideoTextTrack( track, { kind, srcLang } );
			if ( normalizedTrack ) {
				flattenedTracks.push( normalizedTrack );
			}
		} );
	} );

	return flattenedTracks;
}

/**
 * Whether track requests must go through the Jetpack upload-token transport
 * rather than wpcom's proxied apiFetch. Read lazily so importing this module
 * outside the block editor (e.g. the dashboard) has no window dependency.
 *
 * @return {boolean} Whether to use the Jetpack transport.
 */
const shouldUseJetpackVideoFetch = () => window?.videoPressEditorState?.siteType !== 'simple';

const PUBLIC_TRACKS_API_BASE = 'https://public-api.wordpress.com/rest/v1.1';

const debug = debugFactory( 'videopress:tracks:lib:video-tracks' );

type isAutogeneratedChaterFileParamsProps = {
	guid?: VideoGUID;
	isPrivate?: boolean;
};

/**
 * Load the file content, and check if it's autogenerated,
 * based on the `videopress-chapters-auto-generated` comment.
 * The function will try to anticipate the video privacy,
 * based on the block attributes.
 * If the first request fails, it will try again with the token.
 *
 * @param {string}                               fileUrl - the track file url
 * @param {isAutogeneratedChaterFileParamsProps} params  - function parameters
 * @return {Promise<boolean>}   true if the file is autogenerated.
 */
export async function isAutogeneratedChapterFile(
	fileUrl: string,
	params?: isAutogeneratedChaterFileParamsProps
): Promise< boolean > {
	if ( ! fileUrl ) {
		return false;
	}

	let tokenData: null | MediaTokenProps;
	let queryString = '';

	// Try to anticipate the video privacy, based on the block attributes.
	if ( params.isPrivate ) {
		tokenData = await getMediaToken( 'playback', { guid: params.guid } );
		queryString = '?' + new URLSearchParams( { metadata_token: tokenData?.token } ).toString();
	}

	let response = await fetch( fileUrl + queryString );

	// If the file is private, and response is 403, try with the token.
	if ( ! response.ok && response.status === 403 && params.guid ) {
		tokenData = await getMediaToken( 'playback', { guid: params.guid } );
		queryString = '?' + new URLSearchParams( { metadata_token: tokenData?.token } ).toString();
		response = await fetch( fileUrl + queryString );
	}

	if ( ! response.ok ) {
		return false;
	}

	const text = await response.text();
	return /videopress-chapters-auto-generated/.test( text );
}

/**
 * Uploads a track (caption/subtitle) file to a video.
 *
 * Posts to the v1.1 tracks endpoint. The file may be in any supported caption
 * format; the server converts it to WebVTT and replaces any existing track for
 * the same kind and language. Uses different transports for Jetpack and WPCOM.
 *
 * @param {object} track - the track file and metadata
 * @param {string} guid  - the video guid
 * @return {Promise} the api request promise, resolving to the API response for the stored track
 */
export const uploadTrackForGuid = ( track: UploadTrackDataProps, guid: string ) => {
	const { kind, srcLang, label, tmpFile } = track;

	if ( shouldUseJetpackVideoFetch() ) {
		return new Promise( function ( resolve, reject ) {
			getMediaToken( 'upload', { filename: tmpFile.name } )
				.then( ( { token, blogId } ) => {
					const body = new FormData();
					body.append( 'kind', kind );
					body.append( 'srclang', srcLang );
					body.append( 'label', label );
					body.append( 'vtt', tmpFile );

					return fetch( `${ PUBLIC_TRACKS_API_BASE }/videos/${ guid }/tracks`, {
						method: 'POST',
						headers: {
							// Set auth header with upload token.
							Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
						},
						body,
					} ).then( response => {
						if ( ! response.ok ) {
							// Reject on HTTP errors so a JSON error body can't masquerade as a stored track.
							return response
								.json()
								.catch( () => null )
								.then( ( errorBody: { message?: string; error?: string } | null ) => {
									reject(
										new Error(
											errorBody?.message ||
												errorBody?.error ||
												`Track upload failed with status ${ response.status }`
										)
									);
								} );
						}

						return resolve( response.json() );
					} );
				} )
				// Reject on a token-mint failure too, not just a fetch failure, so the
				// caller's promise always settles instead of hanging.
				.catch( reject );
		} );
	}

	return apiFetch( {
		method: 'POST',
		path: `/videos/${ guid }/tracks`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', kind ],
			[ 'srclang', srcLang ],
			[ 'label', label ],
			[ 'vtt', tmpFile ],
		],
	} ).then( ( response: Response ) => response.json() );
};

/**
 * Deletes a track from a video.
 *
 * Posts to the v1.1 tracks/delete endpoint, which identifies the track by kind
 * and language. Uses different transports for Jetpack and WPCOM.
 *
 * @param {object} track - the track to delete
 * @param {string} guid  - the video guid
 * @return {Promise} the api request promise
 */
export const deleteTrackForGuid = ( track: DeleteTrackDataProps, guid: string ) => {
	const { kind, srcLang } = track;

	if ( shouldUseJetpackVideoFetch() ) {
		return new Promise( function ( resolve, reject ) {
			getMediaToken( 'upload' )
				.then( ( { token, blogId } ) => {
					const body = new FormData();
					body.append( 'kind', kind );
					body.append( 'srclang', srcLang );

					return fetch( `${ PUBLIC_TRACKS_API_BASE }/videos/${ guid }/tracks/delete`, {
						method: 'POST',
						headers: {
							// Set auth header with upload token.
							Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
						},
						body,
					} ).then( response => {
						if ( ! response.ok ) {
							// Reject on HTTP errors so a JSON error body can't masquerade as a deletion.
							return response
								.json()
								.catch( () => null )
								.then( ( errorBody: { message?: string; error?: string } | null ) => {
									reject(
										new Error(
											errorBody?.message ||
												errorBody?.error ||
												`Track delete failed with status ${ response.status }`
										)
									);
								} );
						}

						return resolve( response.json() );
					} );
				} )
				// Reject on a token-mint failure too, not just a fetch failure, so the
				// caller's promise always settles instead of hanging.
				.catch( reject );
		} );
	}

	return apiFetch( {
		method: 'POST',
		path: `/videos/${ guid }/tracks/delete`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', kind ],
			[ 'srclang', srcLang ],
		],
	} ).then( ( response: Response ) => response.json() );
};

/**
 * Whether a track `src` is already an absolute URL, as opposed to the
 * filename-only form returned for tracks read from the video info endpoint.
 *
 * @param {string} value - Track `src` value to check.
 * @return {boolean} Whether the value is an absolute URL.
 */
const isAbsoluteUrl = ( value: string ): boolean => /^https?:\/\//i.test( value );

/**
 * Resolve a track's fetchable file URL. Tracks read from the video info carry
 * only a filename; the full URL is that filename appended to the video's
 * `file_url_base`, which the video info endpoint returns alongside the tracks.
 *
 * @param track     - The track whose file URL to resolve.
 * @param guid      - The video GUID.
 * @param isPrivate - Whether the video is private, so the fetch authenticates up front.
 * @return The absolute file URL, or an empty string when it can't be resolved.
 */
const resolveTrackFileUrl = async (
	track: VideoTextTrack,
	guid: string,
	isPrivate: boolean
): Promise< string > => {
	if ( ! track.src ) {
		return '';
	}

	if ( isAbsoluteUrl( track.src ) ) {
		return track.src;
	}

	try {
		const videoInfo = await fetchVideoItem( { guid, isPrivate } );
		const base = videoInfo?.file_url_base?.https;
		return base ? `${ base }${ track.src }` : '';
	} catch ( error ) {
		debug( 'Unable to resolve track file url: %o', error );
		return '';
	}
};

/**
 * Fetches the WebVTT content for an existing track.
 *
 * The v1.1 tracks endpoint has no content route, so the track's source file is
 * the source of truth. Private videos require a playback token, so a 403 is
 * retried with one.
 *
 * @param {object}  track     - the track whose content to load
 * @param {string}  guid      - the video guid, used to resolve the file URL and mint a token
 * @param {boolean} isPrivate - whether the video is private, so requests authenticate up front
 * @return {Promise<string>} the track's text content, or an empty string
 */
export const fetchTrackContentForGuid = async (
	track: VideoTextTrack,
	guid: string,
	isPrivate = false
): Promise< string > => {
	const url = await resolveTrackFileUrl( track, guid, isPrivate );
	if ( ! url ) {
		return '';
	}

	try {
		let response = await fetch( url );

		if ( ! response.ok && response.status === 403 && guid ) {
			const tokenData = await getMediaToken( 'playback', { guid } );
			if ( tokenData?.token ) {
				const separator = url.includes( '?' ) ? '&' : '?';
				const queryString = new URLSearchParams( {
					metadata_token: tokenData.token,
				} ).toString();
				response = await fetch( `${ url }${ separator }${ queryString }` );
			} else {
				debug( 'track content 403 but no playback token was minted for %s', guid );
			}
		}

		if ( ! response.ok ) {
			debug( 'track content fetch failed with status %d', response.status );
			return '';
		}

		return await response.text();
	} catch ( error ) {
		// A network-level failure (offline, DNS, CORS) rejects `fetch`; honor the
		// documented contract by returning an empty string instead of throwing.
		debug( 'track content fetch error: %o', error );
		return '';
	}
};
