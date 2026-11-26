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

// Rows as the `bot-activity` template answers: display order, not ranked by requests.
const RESPONSE = [
	{
		bot_group: 'ai_training',
		group_order: 1,
		bot_name: 'GPTBot',
		total: '300',
		group_total: '300',
	},
	{
		bot_group: 'search_engines',
		group_order: 4,
		bot_name: 'Googlebot',
		total: '900',
		group_total: '900',
	},
	{
		bot_group: 'other_known',
		group_order: 5,
		bot_name: 'axios',
		total: '5000',
		group_total: '5000',
	},
];

const ACCESS_DENIED = { code: 'rest_forbidden', status: 403 };

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
		jest.setSystemTime( new Date( '2026-11-26T12:00:00Z' ) );
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( RESPONSE );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'lists the groups in the order the template gives them', async () => {
		renderWidget();

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();
		expect( groupRows() ).toEqual( [
			'View the bots in AI training',
			'View the bots in Search engines',
			'View the bots in Other known bots',
		] );
	} );

	it.each( [
		[ 'last-7-days', 'raw' ],
		[ 'last-month', 'rollup' ],
		[ 'last-90-days', 'rollup' ],
	] as const )( 'reads %s from the %s table', async ( preset, table ) => {
		renderWidget( preset );

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( `table=${ table }` ) } )
		);
	} );

	it( 'shows that the reader has no access instead of offering a retry', async () => {
		mockApiFetch.mockRejectedValue( ACCESS_DENIED );

		renderWidget();

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the groups on screen when a refresh fails', async () => {
		renderWidget();
		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();

		mockApiFetch.mockRejectedValue( ACCESS_DENIED );
		await act( async () => {
			await queryClient.refetchQueries();
			jest.runOnlyPendingTimers();
		} );

		expect( groupRows() ).toHaveLength( 3 );
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
