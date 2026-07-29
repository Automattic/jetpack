// The one-time introduction to Newsletter Mode.
//
// Shown on first arrival and never again. Both ways out are the same
// acknowledgement — there is nothing to decide, so the button, the backdrop and
// Escape all count as having seen it.
//
// The state lives in user meta, seeded into script data so a returning visitor
// never sees it flash before a fetch resolves. The write is deliberately
// unguarded: the worst case is seeing the intro once more, which beats blocking
// the Dashboard behind a request.

const mockGetNewsletterScriptData = jest.fn< Record< string, unknown > | undefined, [] >();
const mockApiFetch = jest.fn();

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterModeScriptData: () => mockGetNewsletterScriptData(),
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( options: unknown ) => mockApiFetch( options ),
} ) );

import { act, render, screen } from '@testing-library/react';
import { IntroModal } from '../routes/home/intro-modal';

const TITLE = 'The new home for your Newsletter';

beforeEach( () => {
	mockGetNewsletterScriptData.mockReset();
	mockGetNewsletterScriptData.mockReturnValue( {
		introSeen: false,
		introArtUrl: 'https://example.com/art.png',
	} );
	mockApiFetch.mockReset();
	mockApiFetch.mockResolvedValue( { seen: true } );
} );

describe( 'Newsletter Mode intro', () => {
	it( 'greets someone arriving for the first time', () => {
		render( <IntroModal /> );

		expect( screen.getByRole( 'dialog', { name: TITLE } ) ).toBeInTheDocument();
	} );

	it( 'stays away once the server says it has been seen', () => {
		mockGetNewsletterScriptData.mockReturnValue( {
			introSeen: true,
			introArtUrl: 'https://example.com/art.png',
		} );

		render( <IntroModal /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		// Nothing to record — it was never shown.
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows on a surface that carries no script data at all', () => {
		mockGetNewsletterScriptData.mockReturnValue( undefined );

		render( <IntroModal /> );

		// Better to introduce the mode twice than never.
		expect( screen.getByRole( 'dialog', { name: TITLE } ) ).toBeInTheDocument();
	} );

	it( 'closes and records the acknowledgement when "Got it" is clicked', () => {
		render( <IntroModal /> );

		const button = screen.getByRole( 'button', { name: 'Got it' } );
		act( () => button.click() );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-newsletter/v1/intro-seen',
			method: 'POST',
			data: { seen: true },
		} );
	} );

	it( 'treats dismissing any other way as the same acknowledgement', () => {
		render( <IntroModal /> );

		// Escape and the backdrop both reach the component through `onOpenChange`.
		act( () => {
			screen
				.getByRole( 'dialog' )
				.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } ) );
		} );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { data: { seen: true } } )
		);
	} );

	it( 'still closes when the write fails', async () => {
		mockApiFetch.mockRejectedValue( new Error( 'nope' ) );

		render( <IntroModal /> );

		const button = screen.getByRole( 'button', { name: 'Got it' } );
		await act( async () => {
			button.click();
		} );

		// Seeing it once more is a smaller cost than a modal that will not close.
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );
} );
