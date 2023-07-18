import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

// Pexels constants
const PEXELS_ID = 'pexels';
const PEXELS_NAME = 'Pexels Free Photos';
const PEXELS_SEARCH_PLACEHOLDER = `Search ${ PEXELS_NAME }`;

// Google Photos constants
const GOOGLE_PHOTOS_ID = 'google_photos';
const GOOGLE_PHOTOS_NAME = 'Google Photos';
const GOOGLE_PHOTOS_SEARCH_PLACEHOLDER = `Search ${ GOOGLE_PHOTOS_NAME }`;

// Search constants
const DEFAULT_QUERY = 'mountain';
const DEFAULT_SEARCH: MediaSearch = {
	per_page: 25,
	search: DEFAULT_QUERY,
};

/**
 * External media endpoints.
 */
// eslint-disable-next-line no-shadow
enum WpcomMediaEndpoints {
	List = '/wpcom/v2/external-media/list/',
}

/**
 * External media sources.
 */
// eslint-disable-next-line no-shadow
enum MediaSource {
	Pexels = 'pexels',
	GooglePhotos = 'google_photos',
}

/**
 * Gutenberg media category search DTO.
 */
type MediaSearch = {
	per_page: number;
	search: string;
};

/**
 * Gutenberg media item DTO.
 */
type MediaItem = {
	sourceId: string;
	id: string;
	caption: string;
	previewUrl: string;
};

/**
 * WPCOM media list item DTO.
 */
type WpcomMediaItem = {
	ID: string;
	URL: string;
	caption: string;
	thumbnails: {
		thumbnail: string;
	};
};

/**
 * WPCOM media list response DTO.
 */
type WpcomMediaResponse = {
	found: number;
	media: WpcomMediaItem[];
};

type ConnectedMediaSourceCallback = ( response: WpcomMediaResponse ) => void;

/**
 * Get media URL for a given MediaSource.
 *
 * @param {MediaSource} source - MediaSource to get URL for.
 * @param {MediaSearch} mediaCategorySearch - MediaCategorySearch to filter for.
 * @returns {string} Media URL.
 */
const getMediaApiUrl = ( source: MediaSource, mediaCategorySearch: MediaSearch ) =>
	addQueryArgs( `${ WpcomMediaEndpoints.List }${ source }`, {
		number: mediaCategorySearch.per_page || 25,
		path: 'recent',
		search: mediaCategorySearch.search || DEFAULT_QUERY,
	} );

/**
 * Maps a WPCOM media list item to a Gutenberg media category item.
 *
 * @param {WpcomMediaItem} item - WPCOM media list item to map.
 * @returns {MediaItem} Mapped media category item.
 */
const wpcomMediaToGutenbergMedia = ( item: WpcomMediaItem ): MediaItem => ( {
	...item,
	sourceId: item.ID,
	id: item.ID,
	caption: item.caption,
	previewUrl: item.thumbnails.thumbnail,
} );

/**
 * Builds a Gutenberg media category object.
 *
 * @param {string} name - Name of the media category.
 * @param {string} label - Label of the media category.
 * @param {string} searchPlaceholder - Search placeholder of the media category.
 * @param {MediaSource} source - MediaSource of the media category.
 * @returns {object} Media category object.
 */
const buildMediaCategory = (
	name: string,
	label: string,
	searchPlaceholder: string,
	source: MediaSource
) => ( {
	name: name,
	labels: {
		name: label,
		search_items: searchPlaceholder,
	},
	mediaType: 'image',
	fetch: async ( mediaCategorySearch: MediaSearch ) =>
		await apiFetch( {
			path: getMediaApiUrl( source, mediaCategorySearch ),
			method: 'GET',
		} )
			.then( ( response: WpcomMediaResponse ) => response.media.map( wpcomMediaToGutenbergMedia ) )
			// Null object pattern, we don't want to break if the API fails.
			.catch( () => [] ),
	getReportUrl: null,
	isExternalResource: true,
} );

/**
 * Checks if a given MediaSource is connected and calls the callback with the response.
 *
 * @param {MediaSource} source - MediaSource to check.
 * @param {ConnectedMediaSourceCallback} isConnectedCallback - Callback to call with the response.
 * @returns {void}
 */
const isMediaSourceConnected = (
	source: MediaSource,
	isConnectedCallback: ConnectedMediaSourceCallback
) =>
	apiFetch( {
		path: getMediaApiUrl( source, DEFAULT_SEARCH ),
		method: 'GET',
	} ).then( ( wpcomMediaResponse: WpcomMediaResponse ) =>
		isConnectedCallback( wpcomMediaResponse )
	);

/**
 * Get Pexels media category.
 *
 * @returns {object} Pexels media category.
 */
export const getPexelsMediaCategory = () =>
	buildMediaCategory( PEXELS_ID, PEXELS_NAME, PEXELS_SEARCH_PLACEHOLDER, MediaSource.Pexels );

/**
 * Checks if GooglePhotos is connected and calls the callback with the response.
 *
 * @param {ConnectedMediaSourceCallback} isConnectedCallback
 * @returns {void}
 */
export const isGooglePhotosConnected = ( isConnectedCallback: ConnectedMediaSourceCallback ) =>
	isMediaSourceConnected( MediaSource.GooglePhotos, isConnectedCallback );

/**
 * Get Google Photos media category.
 *
 * @returns {object} Google Photos media category.
 */
export const getGooglePhotosMediaCategory = () =>
	buildMediaCategory(
		GOOGLE_PHOTOS_ID,
		GOOGLE_PHOTOS_NAME,
		GOOGLE_PHOTOS_SEARCH_PLACEHOLDER,
		MediaSource.GooglePhotos
	);
