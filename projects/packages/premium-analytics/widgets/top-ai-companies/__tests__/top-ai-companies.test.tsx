/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
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

function renderWidget() {
	return render(
		<TopAiCompanies
			attributes={ { reportParams: getDefaultQueryParams( false, 'last-7-days' ) } }
		/>
	);
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

	it( 'says there were no requests rather than drawing an empty list', async () => {
		mockApiFetch.mockResolvedValue( [] );

		renderWidget();

		await expect(
			screen.findByText( 'No requests from AI bots in this period.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'offers a retry when the companies cannot be loaded', async () => {
		mockApiFetch.mockRejectedValue( { status: 403 } );

		renderWidget();

		await userEvent.click( await screen.findByRole( 'button', { name: 'Retry' } ) );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
	} );
} );
