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
		columns: null,
		count: null,
		instagramUser: null,
		isStackedOnMobile: false,
		spacing: null,
	};

	const setAttributes = jest.fn();
	const disconnectFromService = jest.fn();

	const defaultProps = {
		attributes: defaultAttributes,
		currentUserConnected: true,
		disconnectFromService,
		renderSidebarNotice,
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

	/**
	 * 👀 Write tests specific to this block's edit component.
	 *
	 * Tests may cover behaviour such as:
	 * - Loading correctly
	 * - Children are rendered
	 * - Event handler callbacks are called
	 * - Correct attributes are applied in markup
	 * - Appropriate CSS classes applied
	 */

	/**
	 * 👀 Example:
	 * test( 'displays with customText attribute', () => {
	 * 		render( <YourEditComponent { ...defaultProps } /> );
	 * 		expect( screen.getByText( 'Custom text rendered in block' ) ).toBeInTheDocument();
	 * } );
	 */
	test( 'renders the Instagram connection placeholder when the user has no existing connection', async () => {
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

		await waitFor( () =>
			expect( screen.getByText( 'Connect to Instagram' ) ).toBeInTheDocument()
		);
	} );

	test( 'renders the Instagram connection placeholder when the user has no existing connection', async () => {
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

		await waitFor( () =>
			expect( screen.getByText( 'Connect to Instagram' ) ).toBeInTheDocument()
		);
	} );
} );
