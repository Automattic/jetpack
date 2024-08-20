import jetpackAnalytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { waitFor } from '../../wait-for';
import { store as mediaStore } from '../store';
import { MediaSource } from './types';

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
 * WPCOM media type of the WPCOM Media Api.
 */
// eslint-disable-next-line no-shadow
enum WpcomMediaItemType {
	Image = 'image',
	Video = 'video',
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
	name: string | null;
	file: string;
	thumbnails: {
		thumbnail: string;
	};
	type: WpcomMediaItemType;
};

/**
 * WPCOM media list response DTO.
 */
type WpcomMediaResponse = {
	found: number;
	media: WpcomMediaItem[];
};

/**
 * Get media URL for a given MediaSource.
 *
 * @param {MediaSource} source      - MediaSource to get URL for.
 * @param {MediaSearch} mediaSearch - MediaCategorySearch to filter for.
 * @return {string} Media URL.
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
 * @return {MediaItem} Mapped media category item.
 */
const mapWpcomMediaToMedia = ( item: WpcomMediaItem ): MediaItem => ( {
	caption: item?.caption ?? '',
	previewUrl: item.thumbnails.thumbnail,
	title: item?.title ?? item?.name ?? item.file,
	url: item.URL,
} );

/**
 * Builds a Gutenberg media category object.
 *
 * @param {string}      name              - Name of the media category.
 * @param {string}      label             - Label of the media category.
 * @param {string}      searchPlaceholder - Search placeholder of the media category.
 * @param {MediaSource} source            - MediaSource of the media category.
 * @param {MediaSearch} defaultSearch     - Default search of the media category.
 * @return {object} Media category object.
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
			.then( ( response: WpcomMediaResponse ) => {
				const mediaItems = response.media
					.filter( wpcomMediaItem => wpcomMediaItem.type === WpcomMediaItemType.Image )
					.map( mapWpcomMediaToMedia );
				jetpackAnalytics.tracks.recordEvent( 'jetpack_editor_media_inserter_external_source', {
					mediaSource: source.toString(),
					results: mediaItems.length,
					search:
						mediaCategorySearch?.search === '' ? defaultSearch.search : mediaCategorySearch.search,
				} );

				return mediaItems;
			} )
			// Null object pattern, we don't want to break if the API fails.
			.catch( () => [] ),
	getReportUrl: null,
	isExternalResource: true,
} );

/**
 * Get Google Photos media category.
 *
 * @return {object} Google Photos media category.
 */
const googlePhotosProvider = () =>
	buildMediaCategory(
		GOOGLE_PHOTOS_ID,
		GOOGLE_PHOTOS_NAME,
		GOOGLE_PHOTOS_SEARCH_PLACEHOLDER,
		MediaSource.GooglePhotos,
		DEFAULT_GOOGLE_PHOTOS_SEARCH
	);

/**
 * Checks if a given MediaSource is connected and calls the callback with the response.
 *
 * @param {MediaSource} source - MediaSource to check.
 * @return {void}
 */
const isMediaSourceConnected = async ( source: MediaSource ) =>
	apiFetch< boolean | WpcomMediaResponse >( {
		path: getMediaApiUrl( source, DEFAULT_PEXELS_SEARCH ),
		method: 'GET',
	} )
		.then( response => response )
		.catch( () => false );

/**
 * Checks if the inserter is opened.
 *
 * @return {boolean} True if the inserter is opened false otherwise.
 */
const isInserterOpened = (): boolean => {
	/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
	const selectIsInserterOpened = ( select( 'core/editor' ) as any )?.isInserterOpened;

	const editorIsInserterOpened = selectIsInserterOpened?.();

	return (
		editorIsInserterOpened ||
		select( 'core/edit-site' )?.isInserterOpened() ||
		select( 'core/edit-widgets' )?.isInserterOpened()
	);
};

const registerInInserter = ( mediaCategoryProvider: () => object ) =>
	// Remove as soon @types/wordpress__block-editor is up to date
	// eslint-disable-next-line
	// @ts-ignore
	dispatch( 'core/block-editor' )?.registerInserterMediaCategory?.( mediaCategoryProvider() );

/**
 * Get Pexels media category.
 *
 * @return {object} Pexels media category.
 */
const pexelsProvider = () =>
	buildMediaCategory(
		PEXELS_ID,
		PEXELS_NAME,
		PEXELS_SEARCH_PLACEHOLDER,
		MediaSource.Pexels,
		DEFAULT_PEXELS_SEARCH
	);

/**
 * Checks if a given MediaSource is authenticated in the store.
 *
 * @param {MediaSource} source - MediaSource to check.
 * @return {boolean} True if the MediaSource is authenticated false otherwise.
 */
const isAuthenticatedByWithMediaComponent = ( source: MediaSource ) =>
	!! select( mediaStore ).isAuthenticated( source );

/**
 * Adds Google Photos to the media inserter if/when it's connected.
 * We will not remove Google Photos from the inserter if the user disconnects Google Photos during runtime.
 */
export const addGooglePhotosToMediaInserter = async () => {
	waitFor( isInserterOpened ).then( async () => {
		const isConnected = await isMediaSourceConnected( MediaSource.GooglePhotos );

		if ( isConnected ) {
			registerInInserter( googlePhotosProvider );
			return;
		}

		waitFor( () => isAuthenticatedByWithMediaComponent( MediaSource.GooglePhotos ) ).then( () =>
			registerInInserter( googlePhotosProvider )
		);
	} );
};

/**
 * Adds Pexels to the media inserter. There is no need to check if it's connected because it's always connected.
 */
export const addPexelsToMediaInserter = () => {
	waitFor( isInserterOpened ).then( () => registerInInserter( pexelsProvider ) );
};

/**
 * Authenticates a given MediaSource.
 *
 * @param {MediaSource} source          - MediaSource to authenticate.
 * @param {boolean}     isAuthenticated - True if the MediaSource is authenticated false otherwise.
 */
export const authenticateMediaSource = ( source: MediaSource, isAuthenticated: boolean ) => {
	dispatch( mediaStore ).setAuthenticated( source, isAuthenticated );
};
