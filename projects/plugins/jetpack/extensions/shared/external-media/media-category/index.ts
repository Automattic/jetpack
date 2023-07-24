import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

// Pexels constants
const PEXELS_ID = 'pexels';
const PEXELS_NAME = __( 'Pexels Free Photos', 'jetpack' );
const PEXELS_SEARCH_PLACEHOLDER = __( 'Search Pexels Free Photos', 'jetpack' );
const DEFAULT_PEXELS_SEARCH: MediaSearch = {
	per_page: 10,
	search: 'mountain',
};

// Google Photos constants
const GOOGLE_PHOTOS_ID = 'google_photos';
const GOOGLE_PHOTOS_NAME = __( 'Google Photos', 'jetpack' );
const GOOGLE_PHOTOS_SEARCH_PLACEHOLDER = __( 'Search Google Photos', 'jetpack' );
const DEFAULT_GOOGLE_PHOTOS_SEARCH: MediaSearch = {
	per_page: 25,
	search: '',
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
	caption: string;
	previewUrl: string;
	title: string;
	url: string;
};

/**
 * WPCOM media list item DTO.
 */
type WpcomMediaItem = {
	URL: string;
	caption: string;
	// Sometimes the title is null, so we need to handle that case.
	title: string | null;
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
 * @param {MediaSearch} mediaSearch - MediaCategorySearch to filter for.
 * @returns {string} Media URL.
 */
const getMediaApiUrl = ( source: MediaSource, mediaSearch: MediaSearch ) =>
	addQueryArgs( `${ WpcomMediaEndpoints.List }${ source }`, {
		...( mediaSearch.search && { search: mediaSearch.search } ),
		number: mediaSearch.per_page || 25,
		path: 'recent',
	} );

/**
 * Maps a WPCOM media item to a Gutenberg media item.
 *
 * @param {WpcomMediaItem} item - WPCOM media list item to map.
 * @returns {MediaItem} Mapped media category item.
 */
const mapWpcomMediaToMedia = ( item: WpcomMediaItem ): MediaItem => ( {
	caption: item?.caption ?? '',
	previewUrl: item.thumbnails.thumbnail,
	title: item?.title ?? '',
	url: item.URL,
} );

/**
 * Builds a Gutenberg media category object.
 *
 * @param {string} name - Name of the media category.
 * @param {string} label - Label of the media category.
 * @param {string} searchPlaceholder - Search placeholder of the media category.
 * @param {MediaSource} source - MediaSource of the media category.
 * @param {MediaSearch} defaultSearch - Default search of the media category.
 * @returns {object} Media category object.
 */
const buildMediaCategory = (
	name: string,
	label: string,
	searchPlaceholder: string,
	source: MediaSource,
	defaultSearch: MediaSearch
) => ( {
	name: name,
	labels: {
		name: label,
		search_items: searchPlaceholder,
	},
	mediaType: 'image',
	fetch: async ( mediaCategorySearch: MediaSearch ) =>
		await apiFetch( {
			path: getMediaApiUrl( source, {
				per_page: defaultSearch.per_page,
				search:
					mediaCategorySearch?.search === '' ? defaultSearch.search : mediaCategorySearch.search,
			} ),
			method: 'GET',
		} )
			.then( ( response: WpcomMediaResponse ) => response.media.map( mapWpcomMediaToMedia ) )
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
		path: getMediaApiUrl( source, DEFAULT_PEXELS_SEARCH ),
		method: 'GET',
	} )
		.then( ( wpcomMediaResponse: WpcomMediaResponse ) => isConnectedCallback( wpcomMediaResponse ) )
		.catch( () => null );

/**
 * Get Pexels media category.
 *
 * @returns {object} Pexels media category.
 */
export const getPexelsMediaCategory = () =>
	buildMediaCategory(
		PEXELS_ID,
		PEXELS_NAME,
		PEXELS_SEARCH_PLACEHOLDER,
		MediaSource.Pexels,
		DEFAULT_PEXELS_SEARCH
	);

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
		MediaSource.GooglePhotos,
		DEFAULT_GOOGLE_PHOTOS_SEARCH
	);
