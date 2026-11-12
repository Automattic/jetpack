import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { createReduxStore, register } from '@wordpress/data';
import { render, screen } from 'test/test-utils';
import SupportLink, { getSupportUrl, openWpcomSupportDoc } from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn().mockReturnValue( false ),
} ) );

const setShowSupportDoc = jest.fn( ( link, postId ) => ( {
	type: 'SHOW_SUPPORT_DOC',
	link,
	postId,
} ) );

describe( 'SupportLink', () => {
	const props = {
		href: 'https://jetpack.com/support/foo/',
		wpcomLink: 'https://wordpress.com/support/foo/',
	};

	beforeAll( () => {
		register(
			createReduxStore( 'automattic/help-center', {
				reducer: ( state = {} ) => state,
				actions: { setShowSupportDoc },
			} )
		);
	} );

	afterEach( () => {
		isWpcomPlatformSite.mockReturnValue( false );
		setShowSupportDoc.mockClear();
	} );

	it( 'opens the Jetpack doc in a new tab on self-hosted sites', () => {
		render( <SupportLink { ...props }>Learn more</SupportLink> );
		const link = screen.getByRole( 'link', { name: /Learn more/ } );
		expect( link ).toHaveAttribute( 'href', props.href );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'opens the WordPress.com doc in the Help Center on WordPress.com sites', () => {
		isWpcomPlatformSite.mockReturnValue( true );
		render(
			<SupportLink { ...props } wpcomPostId={ 42 }>
				Learn more
			</SupportLink>
		);
		const link = screen.getByRole( 'link', { name: 'Learn more' } );
		expect( link ).toHaveAttribute( 'href', props.wpcomLink );
		link.click();
		expect( setShowSupportDoc ).toHaveBeenCalledWith( props.wpcomLink, 42 );
	} );

	it( 'falls back to the Jetpack doc when no wpcomLink is given', () => {
		isWpcomPlatformSite.mockReturnValue( true );
		render( <SupportLink href={ props.href }>Learn more</SupportLink> );
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			props.href
		);
	} );
} );

describe( 'getSupportUrl', () => {
	afterEach( () => isWpcomPlatformSite.mockReturnValue( false ) );

	it( 'returns the Jetpack URL off WordPress.com', () => {
		expect( getSupportUrl( 'https://jetpack.com/', 'https://wordpress.com/' ) ).toBe(
			'https://jetpack.com/'
		);
	} );

	it( 'returns the WordPress.com URL on WordPress.com', () => {
		isWpcomPlatformSite.mockReturnValue( true );
		expect( getSupportUrl( 'https://jetpack.com/', 'https://wordpress.com/' ) ).toBe(
			'https://wordpress.com/'
		);
	} );
} );

describe( 'openWpcomSupportDoc', () => {
	afterEach( () => {
		isWpcomPlatformSite.mockReturnValue( false );
		setShowSupportDoc.mockClear();
	} );

	it( 'does nothing off WordPress.com', () => {
		const event = { preventDefault: jest.fn() };
		openWpcomSupportDoc( event, 'https://wordpress.com/support/foo/' );
		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( setShowSupportDoc ).not.toHaveBeenCalled();
	} );

	it( 'opens the Help Center on WordPress.com', () => {
		isWpcomPlatformSite.mockReturnValue( true );
		const event = { preventDefault: jest.fn() };
		openWpcomSupportDoc( event, 'https://wordpress.com/support/foo/', 7 );
		expect( event.preventDefault ).toHaveBeenCalled();
		expect( setShowSupportDoc ).toHaveBeenCalledWith( 'https://wordpress.com/support/foo/', 7 );
	} );
} );
