/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import BotActivity from '../render';
import type { PresetType } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Rows as the `bot-class-and-name` template answers each `bot_category`.
const RESPONSES: Record< string, unknown > = {
	ai: [ { traffic_class: 'AI Data Scraper', bot_name: 'GPTBot', total: '300' } ],
	'non-ai': [
		{ traffic_class: 'Search Engine Crawler', bot_name: 'Googlebot', total: '900' },
		{ traffic_class: 'Fetcher', bot_name: 'facebookexternalhit', total: '100' },
	],
};

const ACCESS_DENIED = { code: 'rest_forbidden', status: 403 };

function categoryOf( path: string ) {
	return new URLSearchParams( path.split( '?' )[ 1 ] ).get( 'bot_category' ) ?? '';
}

function answer( failing?: string ) {
	mockApiFetch.mockImplementation( ( { path } ) =>
		categoryOf( path ) === failing
			? Promise.reject( ACCESS_DENIED )
			: Promise.resolve( RESPONSES[ categoryOf( path ) ] )
	);
}

function renderWidget( preset: PresetType = 'last-7-days' ) {
	return render(
		<BotActivity attributes={ { reportParams: getDefaultQueryParams( false, preset ) } } />
	);
}

function groupRows() {
	return screen
		.queryAllByRole( 'button', { name: /^View the bots in / } )
		.map( button => button.getAttribute( 'aria-label' ) );
}

describe( 'BotActivity', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		answer();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'ranks the groups of the AI and the other bots together', async () => {
		renderWidget();

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in Search engines' } )
		).resolves.toBeInTheDocument();

		expect( groupRows() ).toEqual( [
			'View the bots in Search engines',
			'View the bots in AI training',
			'View the bots in Other known bots',
		] );
	} );

	it( 'shows the error rather than half of the groups when one first load fails', async () => {
		answer( 'non-ai' );

		renderWidget();

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( groupRows() ).toEqual( [] );
	} );

	it( 'keeps the groups on screen when a refresh of one half fails', async () => {
		renderWidget();
		await expect(
			screen.findByRole( 'button', { name: 'View the bots in Search engines' } )
		).resolves.toBeInTheDocument();

		answer( 'non-ai' );
		await act( async () => {
			await queryClient.refetchQueries();
			jest.runOnlyPendingTimers();
		} );

		expect( groupRows() ).toHaveLength( 3 );
		expect( screen.queryByText( "You don't have access to this data." ) ).not.toBeInTheDocument();
	} );

	it( 'asks for a shorter period instead of requesting more than a year', async () => {
		renderWidget( 'last-3-years' );

		await expect(
			screen.findByText(
				'Bot activity is available for up to a year at a time. Choose a shorter period.'
			)
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
