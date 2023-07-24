/**
 * External Media Index Tests.
 * You can run these tests locally by executing `jest --config=tests/jest.config.extensions.js external-media-index-test.js`
 * Make sure you are in the `projects/plugins/jetpack` directory before running the command.
 */

// Import jest-fetch-mock to mock fetch API calls.
import apiFetch from '@wordpress/api-fetch';
import {
	getGooglePhotosMediaCategory,
	getPexelsMediaCategory,
	isGooglePhotosConnected,
} from '../media-category/index';

jest.mock( '@wordpress/api-fetch' );

const ANY_VALID_SEARCH = { per_page: 25, search: 'test' };

const ANY_CONNECTION_ERROR = Promise.reject( 'Any connection error' );

const ANY_VALID_WPCOM_MEDIA_ITEM = {
	URL: 'ANY_VALID_URL',
	caption: 'ANY_VALID_CAPTION',
	title: 'ANY_VALID_TITLE',
	thumbnails: {
		thumbnail: 'ANY_VALID_THUMBNAIL_URL',
	},
};
const ANY_VALID_WPCOM_RESPONSE = Promise.resolve( {
	found: 1,
	media: [ ANY_VALID_WPCOM_MEDIA_ITEM ],
} );

const MAPPED_VALID_WPCOM_MEDIA_ITEM = {
	caption: ANY_VALID_WPCOM_MEDIA_ITEM.caption,
	previewUrl: ANY_VALID_WPCOM_MEDIA_ITEM.thumbnails.thumbnail,
	title: ANY_VALID_WPCOM_MEDIA_ITEM.title,
	url: ANY_VALID_WPCOM_MEDIA_ITEM.URL,
};

describe( 'Media API Tests', () => {
	beforeEach( () => {
		apiFetch.mockClear();
	} );

	it( 'fetches Pexels media category', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_VALID_WPCOM_RESPONSE );

		// When.
		const mediaCategory = getPexelsMediaCategory();
		const mediaItems = await mediaCategory.fetch( ANY_VALID_SEARCH );

		// Then.
		expect( mediaItems ).toBeDefined();
		expect( mediaItems ).toHaveLength( 1 );
		expect( mediaItems[ 0 ] ).toStrictEqual( MAPPED_VALID_WPCOM_MEDIA_ITEM );
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'fetches Pexels media category with api error', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_CONNECTION_ERROR );

		// When.
		const mediaCategory = getPexelsMediaCategory();
		const mediaItems = await mediaCategory.fetch( ANY_VALID_SEARCH );

		// Then.
		expect( mediaItems ).toBeDefined();
		expect( mediaItems ).toHaveLength( 0 );
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'fetches Google Photos media category', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_VALID_WPCOM_RESPONSE );

		// When.
		const mediaCategory = getGooglePhotosMediaCategory();
		const mediaItems = await mediaCategory.fetch( ANY_VALID_SEARCH );

		// Then.
		expect( mediaItems ).toBeDefined();
		expect( mediaItems ).toHaveLength( 1 );
		expect( mediaItems[ 0 ] ).toStrictEqual( MAPPED_VALID_WPCOM_MEDIA_ITEM );
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'fetches Google Photos media category with api error', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_CONNECTION_ERROR );

		// When.
		const mediaCategory = getGooglePhotosMediaCategory();
		const mediaItems = await mediaCategory.fetch( ANY_VALID_SEARCH );

		// Then.
		expect( mediaItems ).toBeDefined();
		expect( mediaItems ).toHaveLength( 0 );
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'checks if Google Photos is connected', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_VALID_WPCOM_RESPONSE );
		let mediaResponse = null;
		const SUCCESS = 'success';

		// When.
		await isGooglePhotosConnected( () => {
			mediaResponse = SUCCESS;
		} );

		// Then.
		expect( mediaResponse ).toBeDefined();
		expect( mediaResponse ).toStrictEqual( SUCCESS );
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'checks if Google Photos is not connected', async () => {
		// Given.
		apiFetch.mockReturnValueOnce( ANY_CONNECTION_ERROR );
		let mediaResponse = null;

		// When.
		await isGooglePhotosConnected( response => {
			mediaResponse = response;
		} );

		// Then.
		expect( mediaResponse ).toBeDefined();
		expect( mediaResponse ).toBeNull();
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );
} );
