import { render, screen, fireEvent } from '@testing-library/react';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import ReadMoreLink from '../components/read-more-link';
import {
	GUIDELINES_SUPPORT_REDIRECT_JETPACK,
	GUIDELINES_SUPPORT_REDIRECT_WPCOM,
} from '../constants';
import { recordGuidelinesEvent } from '../lib/tracks';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.fn( source => `https://jetpack.com/redirect/?source=${ source }` ),
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn(),
} ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

describe( 'ReadMoreLink', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'links to the wordpress.com support redirect on wpcom platform sites', () => {
		isWpcomPlatformSite.mockReturnValue( true );

		render( <ReadMoreLink /> );

		expect( screen.getByRole( 'link', { name: /read more/i } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( GUIDELINES_SUPPORT_REDIRECT_WPCOM )
		);
	} );

	it( 'links to the jetpack.com support redirect on self-hosted sites', () => {
		isWpcomPlatformSite.mockReturnValue( false );

		render( <ReadMoreLink /> );

		expect( screen.getByRole( 'link', { name: /read more/i } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( GUIDELINES_SUPPORT_REDIRECT_JETPACK )
		);
	} );

	it( 'records a read_more_click event when clicked', () => {
		isWpcomPlatformSite.mockReturnValue( true );

		render( <ReadMoreLink /> );
		fireEvent.click( screen.getByRole( 'link', { name: /read more/i } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'read_more_click' );
	} );
} );
