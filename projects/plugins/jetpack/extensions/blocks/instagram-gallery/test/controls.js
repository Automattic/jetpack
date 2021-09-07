/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, fireEvent } from '@testing-library/react';

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

	beforeEach( () => {
		disconnectFromService.mockClear();
		setAttributes.mockClear();
	} );

	test( 'renders account settings and allows the connected account to be disconnected', () => {
		render( <InstagramGalleryInspectorControls { ...defaultProps } /> );

		expect( screen.getByText( 'Account Settings' ) ).toBeInTheDocument();
		expect( screen.getByText( '@testjetpackuser' ) ).toBeInTheDocument();
		userEvent.click( screen.getByText( 'Disconnect your account' ) );

		expect( disconnectFromService ).toHaveBeenCalledWith( 'test-access-token' );
	} );

	test( 'renders notice that there are no images available', () => {
		const propsNoImages = { ...defaultProps, accountImageTotal: 0, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsNoImages } /> );

		expect( screen.getAllByText( 'There are currently no posts in your Instagram account.' )[0] ).toBeInTheDocument();
	} );

	test( 'renders notice that there is only one image available', () => {
		const propsOneImage = { ...defaultProps, accountImageTotal: 1, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsOneImage } /> );

		expect( screen.getAllByText( 'There is currently only 1 post in your Instagram account.' )[0] ).toBeInTheDocument();
	} );

	test( 'renders notice that there is only a small number of images available', () => {
		const propsSmallNumberOfImages = { ...defaultProps, accountImageTotal: 3, shouldRenderSidebarNotice: true };
		render( <InstagramGalleryInspectorControls { ...propsSmallNumberOfImages } /> );

		expect( screen.getAllByText( 'There are currently only 3 posts in your Instagram account.' )[0] ).toBeInTheDocument();
	} );

	test( 'updates count when changing number of posts', () => {
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, count: 1 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		userEvent.paste( screen.getAllByLabelText( 'Number of Posts' )[1], '5' );

		expect( setAttributes ).toHaveBeenCalledWith( { count: 15 } );
	} );

	test( 'updates columns when changing number of columns', () => {
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, columns: 0 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		const input = screen.getAllByLabelText( 'Number of Columns' )[ 1 ];
		input.focus();
		fireEvent.change( input, { target: { value: '3' } } );

		expect( setAttributes ).toHaveBeenCalledWith( { columns: 3 } );
	} );

	test( 'updates spacing when changing image spacing', () => {
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, spacing: 0 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		userEvent.paste( screen.getAllByLabelText( 'Image Spacing (px)' )[1], '5' );

		expect( setAttributes ).toHaveBeenCalledWith( { spacing: 5 } );
	} );

	test( 'updates isStackedOnMobile when toggling stack on mobile', () => {
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, isStackedOnMobile: true } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		userEvent.click( screen.getByLabelText( 'Stack on mobile' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { isStackedOnMobile: false } );
	} );
} );
