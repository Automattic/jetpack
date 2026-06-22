/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import getMediaToken from '../get-media-token';
import {
	DeleteTrackDataProps,
	UploadTrackDataProps,
	UpdateTrackDataProps,
	VideoTracksListResult,
} from './types';
/**
 * Types
 */
import type { trackKindOptionProps, VideoTextTrack } from './types';
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

export const SUPPORTED_CAPTION_FORMATS = [
	'.vtt',
	'.srt',
	'.sbv',
	'.sub',
	'.mpsub',
	'.lrc',
	'.smi',
	'.sami',
	'.rt',
	'.ttml',
	'.dfxp',
];

const isTrackKindOption = ( kind: string ): kind is trackKindOptionProps =>
	TRACK_KIND_OPTIONS.includes( kind as trackKindOptionProps );

const TRACKS_API_NAMESPACE = 'wpcom/v2';
const PUBLIC_TRACKS_API_BASE = `https://public-api.wordpress.com/${ TRACKS_API_NAMESPACE }`;

type TrackRequestOptions = {
	method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
	pathSuffix?: string;
	body?: BodyInit;
	formData?: Array< [ string, string | Blob ] >;
	headers?: Record< string, string >;
	filename?: string;
	parse?: 'json' | 'text';
};

type TrackFallback = Pick< VideoTextTrack, 'kind' | 'srcLang' | 'label' > &
	Partial< VideoTextTrack >;
type TrackContentResponse =
	| string
	| {
			code?: string;
			error?: string;
			message?: string;
			content?: string;
	  };
type TrackRequestError = {
	code: string;
	error?: string;
	message: string;
	status?: number;
};

const buildTracksPath = ( guid: string, pathSuffix = '' ) =>
	`/videopress/videos/${ guid }/tracks${ pathSuffix }`;

const getTrackPathSuffix = ( trackId: string | number, suffix = '' ) =>
	`/${ encodeURIComponent( String( trackId ) ) }${ suffix }`;

const maybeString = ( value: unknown ): string | undefined => {
	if ( typeof value === 'string' ) {
		return value;
	}

	if ( typeof value === 'number' ) {
		return String( value );
	}

	return undefined;
};

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

const formatCaptionExtension = ( value: string ) => {
	const extension = value.trim().toLowerCase().replace( /^\.+/, '' );
	return extension ? `.${ extension }` : '';
};

const normalizeSupportedCaptionFormats = ( response: unknown ): string[] => {
	if ( ! isObject( response ) ) {
		return SUPPORTED_CAPTION_FORMATS;
	}

	const value = response.supported_formats || response.supportedFormats || response.formats;
	let formats: string[] = [];

	if ( Array.isArray( value ) ) {
		formats = value.filter( ( format ): format is string => typeof format === 'string' );
	} else if ( isObject( value ) ) {
		formats = Object.keys( value );
	}

	const normalizedFormats = Array.from(
		new Set( formats.map( formatCaptionExtension ).filter( Boolean ) )
	);

	return normalizedFormats.length ? normalizedFormats : SUPPORTED_CAPTION_FORMATS;
};

const getFileFormat = ( fileName: string ) => fileName.split( '.' ).pop()?.toLowerCase();

const normalizeTrackContentResponse = ( response: TrackContentResponse ): string => {
	if ( typeof response === 'string' ) {
		return response;
	}

	if ( response.code || response.error ) {
		throw response;
	}

	return response.content || '';
};

const withoutUndefinedValues = ( value: Record< string, unknown > ) => {
	const output: Record< string, unknown > = {};
	Object.keys( value ).forEach( key => {
		if ( value[ key ] !== undefined ) {
			output[ key ] = value[ key ];
		}
	} );

	return output;
};

const getTrackId = ( track?: Partial< VideoTextTrack | VideoTrackResponseBodyProps > ) =>
	track?.id ?? ( track as VideoTrackResponseBodyProps | undefined )?.track_id;

const hasTrackId = ( trackId: string | number | undefined | null ): trackId is string | number =>
	trackId !== undefined && trackId !== null && String( trackId ) !== '';

const getTrackSrcLang = (
	track: VideoTrackResponseBodyProps,
	fallbackSrcLang?: string
): string | undefined =>
	maybeString( track.srcLang ) ||
	maybeString( track.src_lang ) ||
	maybeString( track.srclang ) ||
	maybeString( track.language ) ||
	fallbackSrcLang;

const getTrackSrc = ( track: VideoTrackResponseBodyProps, fallbackSrc?: string ) =>
	maybeString( track.src ) ||
	maybeString( track.url ) ||
	maybeString( track.download_url ) ||
	maybeString( track.downloadUrl ) ||
	fallbackSrc ||
	'';

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

	return withoutUndefinedValues( {
		id: getTrackId( track ) ?? fallback?.id,
		src: getTrackSrc( track, fallback?.src ),
		kind: kindValue,
		srcLang,
		label: maybeString( track.label ) || fallback?.label || '',
		source: maybeString( track.source ) || fallback?.source,
		status: maybeString( track.status ) || fallback?.status,
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
	} ) as VideoTextTrack;
};

const isObject = ( value: unknown ): value is Record< string, unknown > =>
	typeof value === 'object' && value !== null;

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

export const normalizeVideoTextTrackResponse = (
	response: unknown,
	fallback: TrackFallback
): VideoTextTrack => {
	if ( isObject( response ) ) {
		const nestedTrack = getTracksFromResponseObject( response );
		if ( isObject( nestedTrack ) && ! Array.isArray( nestedTrack ) ) {
			const normalizedNestedTrack = normalizeVideoTextTrack(
				nestedTrack as VideoTrackResponseBodyProps,
				fallback
			);
			if ( normalizedNestedTrack ) {
				return normalizedNestedTrack;
			}
		}

		const normalizedResponseTrack = normalizeVideoTextTrack(
			response as VideoTrackResponseBodyProps,
			fallback
		);
		if ( normalizedResponseTrack ) {
			return normalizedResponseTrack;
		}
	}

	const flattenedTracks = flattenVideoTracks( response as VideoTracksResponseBodyProps );
	const normalizedTrack =
		flattenedTracks.find(
			track => track.kind === fallback.kind && track.srcLang === fallback.srcLang
		) ?? flattenedTracks[ 0 ];

	if ( normalizedTrack ) {
		return withoutUndefinedValues( {
			id: normalizedTrack.id ?? fallback.id,
			kind: normalizedTrack.kind,
			srcLang: normalizedTrack.srcLang,
			label: normalizedTrack.label || fallback.label,
			src: normalizedTrack.src || fallback.src || '',
			source: normalizedTrack.source || fallback.source,
			status: normalizedTrack.status || fallback.status,
			isAutoGenerated: normalizedTrack.isAutoGenerated ?? fallback.isAutoGenerated,
			isAutoSynced: normalizedTrack.isAutoSynced ?? fallback.isAutoSynced,
			isDraft: normalizedTrack.isDraft ?? fallback.isDraft,
			failureReason: normalizedTrack.failureReason || fallback.failureReason,
			downloadUrl: normalizedTrack.downloadUrl || fallback.downloadUrl,
		} ) as VideoTextTrack;
	}

	return withoutUndefinedValues( {
		id: fallback.id,
		kind: fallback.kind,
		srcLang: fallback.srcLang,
		label: fallback.label,
		src: typeof response === 'string' ? response : fallback.src || '',
		source: fallback.source,
		status: fallback.status,
		isAutoGenerated: fallback.isAutoGenerated,
		isAutoSynced: fallback.isAutoSynced,
		isDraft: fallback.isDraft,
		failureReason: fallback.failureReason,
		downloadUrl: fallback.downloadUrl,
	} ) as VideoTextTrack;
};

/**
 * Convert the VideoPress API's nested track response into the flat track list
 * used by the block and caption manager UI. Supports the legacy nested
 * rest/v1.1 shape and the wpcom/v2 list/object shapes.
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

const { siteType = '' } = window?.videoPressEditorState || {};
const shouldUseJetpackVideoFetch = siteType !== 'simple';
const debug = debugFactory( 'videopress:tracks:lib:video-tracks' );

const parseTrackResponse = async < T = unknown >(
	response: Response,
	parse: TrackRequestOptions[ 'parse' ] = 'json'
): Promise< T > => {
	const getHttpErrorResponse = ( parsedResponse: unknown ): TrackRequestError => {
		if ( isObject( parsedResponse ) ) {
			const code = maybeString( parsedResponse.code ) || maybeString( parsedResponse.error );
			const message = maybeString( parsedResponse.message );

			if ( code || message ) {
				return withoutUndefinedValues( {
					code: code || 'videopress_track_request_failed',
					error: maybeString( parsedResponse.error ),
					message: message || code || 'VideoPress track request failed.',
					status: response.status,
				} ) as TrackRequestError;
			}
		}

		return withoutUndefinedValues( {
			code: 'videopress_track_request_failed',
			message:
				response.statusText ||
				`VideoPress track request failed${
					response.status ? ` with status ${ response.status }` : ''
				}.`,
			status: response.status,
		} ) as TrackRequestError;
	};

	if ( parse === 'text' ) {
		const text = await response.text();
		if ( response.ok === false ) {
			throw getHttpErrorResponse( text );
		}
		return text as T;
	}

	const text = await response.text();
	if ( ! text ) {
		if ( response.ok === false ) {
			throw getHttpErrorResponse( {} );
		}
		return {} as T;
	}

	let parsedResponse: T;
	try {
		parsedResponse = JSON.parse( text ) as T;
	} catch ( error ) {
		debug( 'Unable to parse track response as JSON: %o', error );
		if ( response.ok === false ) {
			throw getHttpErrorResponse( text );
		}
		return text as T;
	}

	if ( response.ok === false ) {
		throw getHttpErrorResponse( parsedResponse );
	}

	return parsedResponse;
};

const getUploadAuthorizationHeader = async ( filename?: string ) => {
	const { token, blogId } = await getMediaToken( 'upload', filename ? { filename } : {} );

	if ( ! token || ! blogId ) {
		return {};
	}

	return {
		Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
	};
};

const requestVideoPressTrackResource = async < T = unknown >(
	guid: string,
	{
		method,
		pathSuffix = '',
		body,
		formData,
		headers = {},
		filename,
		parse = 'json',
	}: TrackRequestOptions
): Promise< T > => {
	const path = buildTracksPath( guid, pathSuffix );

	if ( shouldUseJetpackVideoFetch ) {
		const formDataBody = formData?.reduce( ( data, [ key, value ] ) => {
			data.append( key, value );
			return data;
		}, new FormData() );
		const response = await fetch( `${ PUBLIC_TRACKS_API_BASE }${ path }`, {
			method,
			headers: {
				...( await getUploadAuthorizationHeader( filename ) ),
				...headers,
			},
			body: formDataBody || body,
		} );

		return parseTrackResponse< T >( response, parse );
	}

	const response = await apiFetch< Response >( {
		method,
		path,
		apiNamespace: TRACKS_API_NAMESPACE,
		global: true,
		parse: false,
		...( formData ? { formData } : { body } ),
		headers,
	} );

	return parseTrackResponse< T >( response, parse );
};

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
 * Uploads a track to a video.
 * Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid  - the video guid
 * @return {Promise} the api request promise
 */
export const uploadTrackForGuid = ( track: UploadTrackDataProps, guid: string ) => {
	const { kind, srcLang, label, tmpFile } = track;

	return requestVideoPressTrackResource( guid, {
		method: 'POST',
		filename: tmpFile.name,
		formData: [
			[ 'kind', kind ],
			[ 'srclang', srcLang ],
			[ 'label', label ],
			[ 'filedata', tmpFile ],
		],
	} );
};

export const fetchTrackListForGuid = async ( guid: string ): Promise< VideoTracksListResult > => {
	const response = await requestVideoPressTrackResource< VideoTracksResponseBodyProps >( guid, {
		method: 'GET',
	} );

	return {
		tracks: flattenVideoTracks( response ),
		supportedFormats: normalizeSupportedCaptionFormats( response ),
	};
};

export const fetchTracksForGuid = async ( guid: string ): Promise< VideoTextTrack[] > =>
	( await fetchTrackListForGuid( guid ) ).tracks;

const findTrackByKindLanguageForGuid = async (
	guid: string,
	track: Pick< VideoTextTrack, 'kind' | 'srcLang' >
): Promise< VideoTextTrack | null > => {
	const tracks = await fetchTracksForGuid( guid );
	return (
		tracks.find(
			candidate => candidate.kind === track.kind && candidate.srcLang === track.srcLang
		) ?? null
	);
};

const getTrackIdForGuid = async (
	track: DeleteTrackDataProps | UpdateTrackDataProps | VideoTextTrack,
	guid: string
) =>
	getTrackId( track ) ??
	getTrackId( ( await findTrackByKindLanguageForGuid( guid, track ) ) ?? {} );

const deleteTrackWithLegacyEndpoint = ( track: DeleteTrackDataProps, guid: string ) => {
	const { kind, srcLang } = track;

	if ( shouldUseJetpackVideoFetch ) {
		return new Promise( function ( resolve, reject ) {
			getMediaToken( 'upload' ).then( ( { token, blogId } ) => {
				const body = new FormData();
				body.append( 'kind', kind );
				body.append( 'srclang', srcLang );

				const requestOptions = {
					headers: {
						// Set auth header with upload token.
						Authorization: `X_UPLOAD_TOKEN token="${ token }" blog_id="${ blogId }"`,
					},
					method: 'POST',
					body,
				};

				fetch(
					`https://public-api.wordpress.com/rest/v1.1/videos/${ guid }/tracks/delete`,
					requestOptions
				)
					.then( data => {
						try {
							return resolve( data.json() );
						} catch ( error ) {
							return reject( error );
						}
					} )
					.catch( reject );
			} );
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
	} );
};

/**
 * -Deletes a track from a video.
 * -Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid  - the video guid
 * @return {Promise} the api request promise
 */
export const deleteTrackForGuid = async ( track: DeleteTrackDataProps, guid: string ) => {
	const trackId = await getTrackIdForGuid( track, guid ).catch( error => {
		debug( 'Unable to resolve track id before delete: %o', error );
		return null;
	} );

	if ( hasTrackId( trackId ) ) {
		return requestVideoPressTrackResource( guid, {
			method: 'DELETE',
			pathSuffix: getTrackPathSuffix( trackId ),
		} );
	}

	return deleteTrackWithLegacyEndpoint( track, guid );
};

export const updateTrackForGuid = async ( track: UpdateTrackDataProps, guid: string ) => {
	const trackId = await getTrackIdForGuid( track, guid );

	if ( ! hasTrackId( trackId ) ) {
		throw new Error( 'Track ID is required to update track metadata.' );
	}

	return requestVideoPressTrackResource( guid, {
		method: 'PATCH',
		pathSuffix: getTrackPathSuffix( trackId ),
		body: JSON.stringify( {
			kind: track.kind,
			srclang: track.srcLang,
			label: track.label,
		} ),
		headers: {
			'Content-Type': 'application/json',
		},
	} );
};

export const fetchTrackContentForGuid = async (
	track: VideoTextTrack,
	guid: string
): Promise< string > => {
	const trackId = await getTrackIdForGuid( track, guid ).catch( error => {
		debug( 'Unable to resolve track id before fetching content: %o', error );
		return null;
	} );

	if ( hasTrackId( trackId ) ) {
		const response = await requestVideoPressTrackResource< TrackContentResponse >( guid, {
			method: 'GET',
			pathSuffix: getTrackPathSuffix( trackId, '/content' ),
		} );
		return normalizeTrackContentResponse( response );
	}

	if ( ! track.src ) {
		return '';
	}

	const response = await fetch( track.src );
	if ( ! response.ok ) {
		return '';
	}

	return response.text();
};

export const updateTrackContentForGuid = async (
	track: UpdateTrackDataProps,
	guid: string,
	content: string | File
) => {
	const trackId = await getTrackIdForGuid( track, guid );

	if ( ! hasTrackId( trackId ) ) {
		throw new Error( 'Track ID is required to update track content.' );
	}

	const text = typeof content === 'string' ? content : await content.text();
	const format = typeof content === 'string' ? 'vtt' : getFileFormat( content.name );

	return requestVideoPressTrackResource( guid, {
		method: 'PUT',
		pathSuffix: getTrackPathSuffix( trackId, '/content' ),
		body: JSON.stringify( withoutUndefinedValues( { content: text, format } ) ),
		filename: typeof content === 'string' ? undefined : content.name,
		headers: {
			'Content-Type': 'application/json',
		},
	} );
};
