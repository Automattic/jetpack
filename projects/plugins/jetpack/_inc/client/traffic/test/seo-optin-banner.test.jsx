import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { render, screen } from 'test/test-utils';
import SeoOptInBanner from '../seo-optin-banner';

jest.mock( '@wordpress/api-fetch' );

jest.mock( 'lib/analytics', () => ( {
	tracks: { recordEvent: jest.fn() },
} ) );

const CTA = { name: 'Use the new experience' };

describe( 'SeoOptInBanner', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'shows', true ],
		[ 'hides', false ],
	] )( '%s while the opt-in is offered: %s', ( _, optinAvailable ) => {
		window.JetpackScriptData = { seo: { optin_available: optinAvailable } };
		render( <SeoOptInBanner /> );

		expect( screen.queryByText( 'SEO has a new home' ) !== null ).toBe( optinAvailable );
	} );

	it( 'shows the error and re-enables the button when the opt-in fails', async () => {
		window.JetpackScriptData = { seo: { optin_available: true } };
		apiFetch.mockRejectedValue( new Error( 'Request failed' ) );
		render( <SeoOptInBanner /> );

		await userEvent.click( screen.getByRole( 'button', CTA ) );

		await expect( screen.findByText( /Something went wrong/ ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', CTA ) ).toBeEnabled();
	} );
} );
