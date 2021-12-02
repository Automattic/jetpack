/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { JETPACK_DATA_PATH } from '../../../shared/get-jetpack-data';
import InstagramGalleryEdit from '../edit';

const originalFetch = window.fetch;

// Mock connecting site to wpcom.
jest.mock( '../use-connect-wpcom', () => ( {
	__esModule: true,
	default: jest
		.fn()
		.mockReturnValue( { isRequestingWpcomConnectUrl: false, wpcomConnectUrl: undefined } ),
} ) );

describe( 'InstagramGalleryEdit', () => {
	const defaultAttributes = {
		accessToken: null,
		align: null,
		columns: 3,
		count: 9,
		instagramUser: null,
		isStackedOnMobile: false,
		spacing: 10,
	};

	const setAttributes = jest.fn();
	const disconnectFromService = jest.fn();

	const defaultProps = {
		attributes: defaultAttributes,
		currentUserConnected: true,
		disconnectFromService,
		setAttributes,
		clientId: 1,
	};

	beforeEach( () => {
		setAttributes.mockClear();
		window.fetch = jest.fn();
		window[ JETPACK_DATA_PATH ] = {
			jetpack: {
				is_current_user_connected: true,
			},
		};
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'renders the Instagram connection placeholder when the user has no existing connection', async () => {
		// Mock call to the `instagram-gallery/connections` endpoint.
		window.fetch.mockReturnValue(
			Promise.resolve( { status: 200, json: () => Promise.resolve( [] ) } )
		);

		render( <InstagramGalleryEdit { ...defaultProps } /> );

		await waitFor( () =>
			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/instagram-gallery/connections?_locale=user'
			)
		);

		await waitFor( () =>
			expect(
				screen.getByText( 'Connect to Instagram to start sharing your images.' )
			).toBeInTheDocument()
		);

		await waitFor( () => expect( screen.getByText( 'Connect to Instagram' ) ).toBeInTheDocument() );
	} );

	test( 'updates instagram user and access token when selecting existing connection', async () => {
		// Mock call to the `instagram-gallery/connections` endpoint.
		window.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
				json: () => Promise.resolve( [ { token: '123456', username: 'testjetpackuser' } ] ),
			} )
		);

		render( <InstagramGalleryEdit { ...defaultProps } /> );

		await waitFor( () =>
			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/instagram-gallery/connections?_locale=user'
			)
		);

		await waitFor( () =>
			expect( screen.getByText( 'Select your Instagram account:' ) ).toBeInTheDocument()
		);

		await waitFor( () => userEvent.click( screen.getByLabelText( '@testjetpackuser' ) ) );
		await waitFor( () => userEvent.click( screen.getByText( 'Connect to Instagram' ) ) );

		expect( setAttributes ).toHaveBeenLastCalledWith( {
			accessToken: '123456',
			instagramUser: 'testjetpackuser',
		} );
	} );

	test( 'displays text to tell the user to log out of instagram when there is an existing connection', async () => {
		// Mock call to the `instagram-gallery/connections` endpoint.
		window.fetch.mockReturnValue(
			Promise.resolve( {
				status: 200,
				json: () => Promise.resolve( [ { token: '123456', username: 'testjetpackuser' } ] ),
			} )
		);

		render( <InstagramGalleryEdit { ...defaultProps } /> );

		await waitFor( () =>
			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/instagram-gallery/connections?_locale=user'
			)
		);

		await waitFor( () =>
			expect( screen.getByText( 'Select your Instagram account:' ) ).toBeInTheDocument()
		);

		await waitFor( () => userEvent.click( screen.getByLabelText( 'Add a new account' ) ) );
		await waitFor( () =>
			expect(
				screen.getByText(
					'If you are currently logged in to Instagram on this device, you might need to log out of it first.'
				)
			).toBeInTheDocument()
		);

		await waitFor( () => expect( screen.getByText( 'Connect to Instagram' ) ).toBeInTheDocument() );
	} );

	test( 'renders a gallery when an existing connection is active', async () => {
		const images = [
			{
				link: 'instagram-url-1',
				url: 'https://example.com/image-1.jpg',
				title: 'test image 1',
			},
			{
				link: 'instagram-url-2',
				url: 'https://example.com/image-2.jpg',
				title: 'test image 2',
			},
		];

		// Mock call to the `instagram-gallery/gallery` endpoint.
		window.fetch.mockReturnValueOnce(
			Promise.resolve( {
				status: 200,
				json: () => Promise.resolve( { external_name: 'testjetpackuser', images } ),
			} )
		);

		const propsWithConnectedAccount = {
			...defaultProps,
			attributes: { ...defaultAttributes, accessToken: '123456', instagramUser: 'testjetpackuser' },
		};

		render( <InstagramGalleryEdit { ...propsWithConnectedAccount } /> );

		await waitFor( () =>
			expect( window.fetch.mock.calls[ 0 ][ 0 ] ).toEqual(
				'/wpcom/v2/instagram-gallery/gallery?access_token=123456&count=30&_locale=user'
			)
		);

		await waitFor( () => expect( screen.getByAltText( 'test image 1' ) ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByAltText( 'test image 2' ) ).toBeInTheDocument() );
		await waitFor( () =>
			expect( screen.queryByText( 'Connect to Instagram' ) ).not.toBeInTheDocument()
		);
	} );
} );
