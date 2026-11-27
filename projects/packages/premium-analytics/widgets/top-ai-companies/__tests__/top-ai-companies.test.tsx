/**
 * External dependencies
 */
import {
	getDefaultQueryParams,
	queryClient,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import TopAiCompanies from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// One row per bot, as the `ai-providers-with-drill` template answers.
const PROVIDERS_RESPONSE = [
	{ bot_owner: 'OpenAI', bot_name: 'GPTBot', bot_type: 'AI Crawler', total: '300' },
	{ bot_owner: 'OpenAI', bot_name: 'ChatGPT-User', bot_type: 'AI Assistant', total: '100' },
	{ bot_owner: 'Anthropic', bot_name: 'ClaudeBot', bot_type: 'AI Crawler', total: '250' },
	{ bot_owner: '', bot_name: 'Unknown', bot_type: '', total: '50' },
];

function renderWidget( reportParams = getDefaultQueryParams( false, 'last-7-days' ) ) {
	return render( <TopAiCompanies attributes={ { reportParams } } /> );
}

describe( 'TopAiCompanies', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PROVIDERS_RESPONSE );
	} );

	it( 'ranks the companies by requests, with the bots nobody owns last', async () => {
		renderWidget();

		await expect(
			screen.findByRole( 'button', { name: 'View the bots of OpenAI' } )
		).resolves.toBeInTheDocument();
		const rows = screen
			.getAllByRole( 'button', { name: /^View the bots of / } )
			.map( button => button.getAttribute( 'aria-label' ) );

		expect( rows ).toEqual( [
			'View the bots of OpenAI',
			'View the bots of Anthropic',
			'View the bots of Unattributed',
		] );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringMatching(
					/template=ai-providers-with-drill.*table=rollup|table=rollup.*template=ai-providers-with-drill/
				),
			} )
		);
	} );

	it.each( [
		[ 'https://example.com/2026/11/21/hello-world/', '%2F2026%2F11%2F21%2Fhello-world%2F' ],
		[ 'https://example.com/?p=41', '%2F%3Fp%3D41' ],
	] )( 'on the page of the post at %s, counts only its path', async ( permalink, encodedPath ) => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'stats/post/41' ) ? { post: { permalink } } : PROVIDERS_RESPONSE
			)
		);

		renderWidget( { ...getDefaultQueryParams( false, 'last-7-days' ), post_id: 41 } );

		await expect(
			screen.findByRole( 'button', { name: 'View the bots of OpenAI' } )
		).resolves.toBeInTheDocument();
		const edgePaths = mockApiFetch.mock.calls
			.map( ( [ { path } ] ) => path as string )
			.filter( path => path.includes( 'ua-queries' ) );
		// The site's totals must never be requested while the post's path is unknown.
		expect( edgePaths ).not.toHaveLength( 0 );
		expect(
			edgePaths.every( path => new RegExp( `[?&]url=${ encodedPath }(&|$)` ).test( path ) )
		).toBe( true );
	} );

	it( 'opens a company onto its bots and comes back to the companies', async () => {
		renderWidget();

		await userEvent.click(
			await screen.findByRole( 'button', { name: 'View the bots of OpenAI' } )
		);

		const bots = await screen.findByRole( 'list' );
		expect( within( bots ).getByText( 'GPTBot' ) ).toBeInTheDocument();
		expect( within( bots ).getByText( 'ChatGPT-User' ) ).toBeInTheDocument();
		expect( within( bots ).queryByText( 'ClaudeBot' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'All companies' } ) );

		await expect(
			screen.findByRole( 'button', { name: 'View the bots of Anthropic' } )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the shared empty state rather than an empty list', async () => {
		mockApiFetch.mockResolvedValue( [] );

		renderWidget();

		await expect(
			screen.findByText( 'We couldn’t find results for this time period.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'names the folded row by what it opens', async () => {
		mockApiFetch.mockResolvedValue(
			Array.from( { length: 12 }, ( _, index ) => ( {
				bot_owner: `Company ${ index }`,
				bot_name: `Bot ${ index }`,
				bot_type: 'AI Crawler',
				total: String( 120 - index ),
			} ) )
		);

		renderWidget();

		await expect(
			screen.findByRole( 'button', { name: 'View the other companies' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'View the bots of Company 0' } ) ).toBeVisible();
	} );

	it( 'asks for a shorter period instead of a request the table refuses', () => {
		// No preset: the widget root would read the range back from it.
		renderWidget( { from: '2023-11-08', to: '2026-11-07', interval: 'month' } as ReportParams );

		expect( screen.getByText( /Choose a shorter period\./ ) ).toBeVisible();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'says the data is off limits on a 403, with nothing to retry', async () => {
		mockApiFetch.mockRejectedValue( { status: 403 } );

		renderWidget();

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry for a failure that can heal, and loads the companies on it', async () => {
		mockApiFetch.mockRejectedValueOnce( { status: 403, code: 'no_connection' } );

		renderWidget();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Retry' } ) );

		await expect( screen.findByText( 'OpenAI' ) ).resolves.toBeInTheDocument();
	} );
} );
