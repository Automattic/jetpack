import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

let user;

describe( 'ReadMoreLink', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'links to the wordpress.com support redirect on wpcom platform sites', async () => {
		isWpcomPlatformSite.mockReturnValue( true );

		render( <ReadMoreLink /> );

		expect( screen.getByRole( 'link', { name: /read more/i } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( GUIDELINES_SUPPORT_REDIRECT_WPCOM )
		);
	} );

	it( 'links to the jetpack.com support redirect on self-hosted sites', async () => {
		isWpcomPlatformSite.mockReturnValue( false );

		render( <ReadMoreLink /> );

		expect( screen.getByRole( 'link', { name: /read more/i } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( GUIDELINES_SUPPORT_REDIRECT_JETPACK )
		);
	} );

	it( 'records a read_more_click event when clicked', async () => {
		isWpcomPlatformSite.mockReturnValue( true );

		render( <ReadMoreLink /> );
		await user.click( screen.getByRole( 'link', { name: /read more/i } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'read_more_click' );
	} );
} );
