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

	it( 'shows while the opt-in is offered', () => {
		window.JetpackScriptData = { seo: { optin_available: true } };
		render( <SeoOptInBanner /> );

		expect( screen.getByText( 'SEO has a new home' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing once the opt-in is no longer offered', () => {
		window.JetpackScriptData = { seo: { optin_available: false } };
		render( <SeoOptInBanner /> );

		expect( screen.queryByText( 'SEO has a new home' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'fails', () => apiFetch.mockRejectedValueOnce( new Error( 'Request failed' ) ) ],
		[ 'returns no redirect', () => apiFetch.mockResolvedValueOnce( {} ) ],
	] )(
		'shows the error and re-enables the button when the opt-in %s',
		async ( _, mockResponse ) => {
			window.JetpackScriptData = { seo: { optin_available: true } };
			mockResponse();
			render( <SeoOptInBanner /> );

			await userEvent.click( screen.getByRole( 'button', CTA ) );

			await expect( screen.findByText( /Something went wrong/ ) ).resolves.toBeInTheDocument();
			expect( screen.getByRole( 'button', CTA ) ).toBeEnabled();
		}
	);
} );
