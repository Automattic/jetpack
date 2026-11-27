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

type ReportParams = ReturnType< typeof getDefaultQueryParams >;

function paramsFor( preset: PresetType, overrides: Partial< ReportParams > = {} ): ReportParams {
	return { ...getDefaultQueryParams( false, preset ), ...overrides };
}

function renderWidget( reportParams: ReportParams = paramsFor( 'last-7-days' ) ) {
	return render( <BotActivity attributes={ { reportParams } } /> );
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

	// The clock is 26 Nov: the rollup has no rows for 25 and 26 Nov yet.
	it.each( [
		[ 'a week ending today', 'raw', paramsFor( 'last-7-days' ) ],
		[
			'ten days ending three days ago',
			'rollup',
			paramsFor( 'last-7-days', { preset: undefined, from: '2026-11-14', to: '2026-11-23' } ),
		],
		[ '90 days ending today', 'rollup', paramsFor( 'last-90-days' ) ],
	] )( 'reads %s from the %s table', async ( _label, table, reportParams ) => {
		renderWidget( reportParams );

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( `table=${ table }` ) } )
		);
	} );

	it.each( [
		[ 'https://example.com/2026/11/21/hello-world/', '%2F2026%2F11%2F21%2Fhello-world%2F' ],
		[ 'https://example.com/?p=41', '%2F%3Fp%3D41' ],
	] )( 'on the page of the post at %s, counts only its path', async ( permalink, encodedPath ) => {
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( path.includes( 'stats/post/41' ) ? { post: { permalink } } : RESPONSE )
		);

		render(
			<BotActivity
				attributes={ { reportParams: { ...getDefaultQueryParams( false ), post_id: 41 } } }
			/>
		);

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
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

	it( 'requests the comparison period when the host passes comparison dates', async () => {
		const reportParams = getDefaultQueryParams( true, 'last-7-days' );

		renderWidget( reportParams );

		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( `start=${ reportParams.compare_from?.slice( 0, 10 ) }` ),
			} )
		);
	} );

	it( 'asks for a shorter period, not the previous rows, when the range grows past a year', async () => {
		const { rerender } = renderWidget();
		await expect(
			screen.findByRole( 'button', { name: 'View the bots in AI training' } )
		).resolves.toBeInTheDocument();

		rerender( <BotActivity attributes={ { reportParams: paramsFor( 'last-3-years' ) } } /> );

		await expect(
			screen.findByText(
				'Bot activity is available for up to a year at a time. Choose a shorter period.'
			)
		).resolves.toBeInTheDocument();
		expect( groupRows() ).toEqual( [] );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
