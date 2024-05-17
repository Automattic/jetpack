import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

	test( 'renders account settings and allows the connected account to be disconnected', async () => {
		const user = userEvent.setup();
		render( <InstagramGalleryInspectorControls { ...defaultProps } /> );

		expect( screen.getByText( 'Account Settings' ) ).toBeInTheDocument();
		expect( screen.getByText( '@testjetpackuser' ) ).toBeInTheDocument();
		await user.click( screen.getByText( 'Disconnect your account' ) );

		expect( disconnectFromService ).toHaveBeenCalledWith( 'test-access-token' );
	} );

	test( 'renders notice that there are no images available', () => {
		const propsNoImages = {
			...defaultProps,
			accountImageTotal: 0,
			shouldRenderSidebarNotice: true,
		};
		render( <InstagramGalleryInspectorControls { ...propsNoImages } /> );

		expect(
			screen.getAllByText( 'There are currently no posts in your Instagram account.' )[ 0 ]
		).toBeInTheDocument();
	} );

	test( 'renders notice that there is only one image available', () => {
		const propsOneImage = {
			...defaultProps,
			accountImageTotal: 1,
			shouldRenderSidebarNotice: true,
		};
		render( <InstagramGalleryInspectorControls { ...propsOneImage } /> );

		expect(
			screen.getAllByText( 'There is currently only 1 post in your Instagram account.' )[ 0 ]
		).toBeInTheDocument();
	} );

	test( 'renders notice that there is only a small number of images available', () => {
		const propsSmallNumberOfImages = {
			...defaultProps,
			accountImageTotal: 3,
			shouldRenderSidebarNotice: true,
		};
		render( <InstagramGalleryInspectorControls { ...propsSmallNumberOfImages } /> );

		expect(
			screen.getAllByText( 'There are currently only 3 posts in your Instagram account.' )[ 0 ]
		).toBeInTheDocument();
	} );

	test( 'updates count when changing number of posts', async () => {
		const user = userEvent.setup();
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, count: 1 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		await user.click( screen.getAllByLabelText( 'Number of Posts' )[ 1 ] );
		await user.paste( '5' );

		expect( setAttributes ).toHaveBeenCalledWith( { count: 15 } );
	} );

	test( 'updates columns when changing number of columns', async () => {
		const user = userEvent.setup();
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, columns: 0 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		const input = screen.getAllByLabelText( 'Number of Columns' )[ 1 ];
		await user.clear( input );
		await user.type( input, '3' );

		expect( setAttributes ).toHaveBeenCalledWith( { columns: 3 } );
	} );

	test( 'updates spacing when changing image spacing', async () => {
		const user = userEvent.setup();
		const propsSmallCount = { ...defaultProps, attributes: { ...defaultAttributes, spacing: 0 } };
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		await user.click( screen.getAllByLabelText( 'Image Spacing (px)' )[ 1 ] );
		await user.paste( '5' );

		expect( setAttributes ).toHaveBeenCalledWith( { spacing: 5 } );
	} );

	test( 'updates isStackedOnMobile when toggling stack on mobile', async () => {
		const user = userEvent.setup();
		const propsSmallCount = {
			...defaultProps,
			attributes: { ...defaultAttributes, isStackedOnMobile: true },
		};
		render( <InstagramGalleryInspectorControls { ...propsSmallCount } /> );

		await user.click( screen.getByLabelText( 'Stack on mobile' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { isStackedOnMobile: false } );
	} );
} );
