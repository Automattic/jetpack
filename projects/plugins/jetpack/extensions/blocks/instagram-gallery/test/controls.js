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
import InstagramGalleryInspectorControls from '../controls';

describe( 'InstagramGalleryInspectorControls', () => {
	const defaultAttributes = {
		accessToken: 'test-access-token',
		columns: 3,
		count: 9,
		instagramUser: 'testjetpackuser',
		spacing: 10,
		isStackedOnMobile: true,
	};

	const setAttributes = jest.fn();
	const disconnectFromService = jest.fn();

	const defaultProps = {
		accountImageTotal: 15,
		attributes: defaultAttributes,
		currentUserConnected: true,
		disconnectFromService,
		setAttributes,
		shouldRenderSidebarNotice: false,
		clientId: 1,
	};

	// 👀 Tests setup.
	beforeEach( () => {
		disconnectFromService.mockClear();
		setAttributes.mockClear();
	} );

	/**
	 * 👀 Write tests specific to this block controls.
	 *
	 * These may cover whatever controls are added by the block
	 * e.g. Inspector or Block Toolbar controls.
	 *
	 * Tests may cover behaviour such as:
	 * - Correct fields included in controls
	 * - Appropriate attributes and defaults are applied
	 * - User interactions trigger correct event handlers etc.
	 */

	/**
	 * 👀 Example:
	 * test( 'loads settings when toolbar button clicked', async () => {
	 *		render( <WhatsAppButtonConfiguration { ...props } /> );
	 *		userEvent.click( screen.getByLabelText( 'WhatsApp Button Settings' ) );
	 *		await waitFor( () => screen.getByLabelText( 'Country code' ) );
	 *
	 *		expect( screen.getByLabelText( 'Country code' ) ).toBeInTheDocument();
	 * } );
	 */
	test( 'Renders account settings and allows the connected account to be disconnected', async () => {
		render( <InstagramGalleryInspectorControls { ...defaultProps } /> );

		await waitFor( () => screen.getByText( 'Account Settings' ) );
		userEvent.click( screen.getByText( 'Disconnect your account' ) );

		expect( disconnectFromService ).toHaveBeenCalledWith( 'test-access-token' );
	} );

	test( 'Renders notice that there are no images available', async () => {
		const propsNoImages = { ...defaultProps, accountImageTotal: 0, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsNoImages } /> );

		await waitFor( () => expect( screen.getAllByText( 'There are currently no posts in your Instagram account.' )[0] ).toBeInTheDocument() );
	} );

	test( 'Renders notice that there is only one image available', async () => {
		const propsOneImage = { ...defaultProps, accountImageTotal: 1, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsOneImage } /> );

		await waitFor( () => expect( screen.getAllByText( 'There is currently only 1 post in your Instagram account.' )[0] ).toBeInTheDocument() );
	} );

	test( 'Renders notice that there is only a small number of images available', async () => {
		const propsSmallNumberOfImages = { ...defaultProps, accountImageTotal: 3, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsSmallNumberOfImages } /> );

		await waitFor( () => expect( screen.getAllByText( 'There are currently only 3 posts in your Instagram account.' )[0] ).toBeInTheDocument() );
	} );
} );
