/**
 * External Media Index Tests.
 * You can run these tests locally by executing `jest --config=tests/jest.config.extensions.js external-media-service-test.js`
 * Make sure you are in the `projects/plugins/jetpack` directory before running the command.
 */

// Import jest-fetch-mock to mock fetch API calls.
import apiFetch from '@wordpress/api-fetch';
import { select, dispatch } from '@wordpress/data';
import { waitFor } from '../../wait-for';
import { addPexelsToMediaInserter, addGooglePhotosToMediaInserter } from '../media-service/index';

jest.mock( '../../wait-for' );
jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/data/build/select' );
jest.mock( '@wordpress/data/build/dispatch' );

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

const ANY_RESOLVED_WAIT = Promise.resolve();
const ANY_UNRESOLVED_WAIT = new Promise( () => {} );

describe( 'Media API Tests', () => {
	beforeEach( () => {
		apiFetch.mockClear();
		select.mockClear();
		dispatch.mockClear();
		// eslint-disable-next-line testing-library/await-async-utils
		waitFor.mockClear();
	} );

	it( 'registers Pexels in the Media inserter', async () => {
		// Given.
		// The inserter is opened.
		// eslint-disable-next-line testing-library/await-async-utils
		waitFor.mockReturnValue( ANY_RESOLVED_WAIT );

		// When.
		await addPexelsToMediaInserter();

		// Then.
		// The Pexels source is registered.
		expect( dispatch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'does not register Pexels when the Media inserter is closed', async () => {
		// Given.
		// The inserter is never opened.
		// eslint-disable-next-line testing-library/await-async-utils
		waitFor.mockReturnValue( ANY_UNRESOLVED_WAIT );

		// When.
		await addPexelsToMediaInserter();

		// Then.
		// The Pexels source is not registered.
		expect( dispatch.mock.calls ).toHaveLength( 0 );
	} );

	it( 'registers Google Photos in the Media inserter when Google Photos is connected', async () => {
		// Given.
		// The inserter is opened.
		// eslint-disable-next-line testing-library/await-async-utils
		waitFor.mockReturnValue( ANY_RESOLVED_WAIT );
		// The Media Source is connected.
		apiFetch.mockReturnValue( ANY_VALID_WPCOM_RESPONSE );

		// When.
		await addGooglePhotosToMediaInserter();

		// Then.
		// We should not be polling the connection status.
		expect( select.mock.calls ).toHaveLength( 0 );
		// Connection has been checked.
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );

	it( 'does not insert Google Photos in the Media inserter when Google Photos is not connected', async () => {
		// Given.
		// The inserter is opened.
		// eslint-disable-next-line testing-library/await-async-utils
		waitFor.mockReturnValue( ANY_RESOLVED_WAIT );
		// The Media Source is not connected.
		apiFetch.mockReturnValue( ANY_CONNECTION_ERROR );

		// When.
		await addGooglePhotosToMediaInserter();

		// Then.
		// Action to register the source is not dispatched.
		expect( dispatch.mock.calls ).toHaveLength( 0 );
		// Connection has been checked.
		expect( apiFetch.mock.calls ).toHaveLength( 1 );
	} );
} );
