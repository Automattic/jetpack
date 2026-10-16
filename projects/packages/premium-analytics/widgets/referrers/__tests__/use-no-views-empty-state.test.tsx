/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AuthorsWidget from '../../authors/render';
import ClicksWidget from '../../clicks/render';
import DevicesWidget from '../../devices/render';
import FileDownloadsWidget from '../../file-downloads/render';
import LocationsWidget from '../../locations/render';
import SearchTermsWidget from '../../search-terms/render';
import { queryClientWrapper } from '../../test-utils';
import TopPlatformsWidget from '../../top-platforms/render';
import { useNoViewsEmptyState } from '../../use-no-views-empty-state';
import ReferrersWidget from '../render';
import type { ComponentType } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = jest.mocked( apiFetch );

const GENERIC_TEXT = 'We couldn’t find results for this time period.';
const SITE_SUMMARY_PATH = /\/stats(\?|$)/;
const SITE_SUMMARY_KEY = [ 'stats', 'site' ];
const NONE_RECORDED = { description: 'None recorded.' };
const EMPTY_LIST = { isLoading: false, isError: false, isEmpty: true };
const reportParams = getDefaultQueryParams( false, 'last-7-days' );

type SiteSummary = { stats: { views: number } } | Error | Promise< never >;

/**
 * Answer every list request with no rows and the site summary with the given response.
 *
 * @param siteSummary - The `/stats` response, the error it rejects with, or a promise that leaves it unanswered.
 */
function mockEmptyLists( siteSummary: SiteSummary ) {
	mockApiFetch.mockImplementation( ( { path = '' } ) => {
		if ( ! SITE_SUMMARY_PATH.test( path ) ) {
			return Promise.resolve( { date: '2026-06-22', days: {}, summary: {} } );
		}

		return siteSummary instanceof Error
			? Promise.reject( siteSummary )
			: Promise.resolve( siteSummary );
	} );
}

beforeEach( () => {
	jest.useFakeTimers();
	queryClient.clear();
	mockApiFetch.mockReset();
} );

afterEach( () => {
	jest.useRealTimers();
} );

const WIDGETS: Array< [ string, ComponentType< { attributes: object } >, string ] > = [
	[ 'Top referrers', ReferrersWidget, 'You don’t have referrers recorded yet.' ],
	[ 'Devices', DevicesWidget, 'You don’t have devices recorded yet.' ],
	[ 'Top locations', LocationsWidget, 'You don’t have locations recorded yet.' ],
	[ 'Top platforms', TopPlatformsWidget, 'You don’t have platforms recorded yet.' ],
	[ 'Top links clicked', ClicksWidget, 'You don’t have clicked links recorded yet.' ],
	[ 'Top searched terms', SearchTermsWidget, 'You don’t have search terms recorded yet.' ],
	[ 'Top downloaded', FileDownloadsWidget, 'You don’t have downloads recorded yet.' ],
	[ 'Popular authors', AuthorsWidget, 'You don’t have authors recorded yet.' ],
];

it.each( WIDGETS )(
	'%s says nothing is recorded yet when the site has no all-time views',
	async ( _title, Widget, text ) => {
		mockEmptyLists( { stats: { views: 0 } } );

		render( <Widget attributes={ { reportParams } } /> );

		await expect( screen.findByText( text ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( GENERIC_TEXT ) ).not.toBeInTheDocument();
	}
);

it( 'keeps the period text when the site has views outside the selected range', async () => {
	mockEmptyLists( { stats: { views: 12 } } );

	render( <ReferrersWidget attributes={ { reportParams } } /> );

	await expect( screen.findByText( GENERIC_TEXT ) ).resolves.toBeInTheDocument();
	expect( screen.queryByText( 'You don’t have referrers recorded yet.' ) ).not.toBeInTheDocument();
} );

it.each( WIDGETS )(
	'%s shows neither text while the all-time views request has no answer',
	async ( _title, Widget, text ) => {
		mockEmptyLists( new Promise< never >( () => {} ) );

		render( <Widget attributes={ { reportParams } } /> );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( { path: expect.stringMatching( SITE_SUMMARY_PATH ) } )
			)
		);
		expect( screen.queryByText( GENERIC_TEXT ) ).not.toBeInTheDocument();
		expect( screen.queryByText( text ) ).not.toBeInTheDocument();
	}
);

it( 'stops saying nothing is recorded when a refresh fails after a cached zero', async () => {
	mockEmptyLists( { stats: { views: 0 } } );
	const { result } = renderHook( () => useNoViewsEmptyState( EMPTY_LIST, 'None recorded.' ), {
		wrapper: queryClientWrapper,
	} );
	await waitFor( () => expect( result.current.empty ).toEqual( NONE_RECORDED ) );

	mockEmptyLists( Object.assign( new Error( 'Forbidden' ), { data: { status: 403 } } ) );
	await act( () => queryClient.refetchQueries( { queryKey: SITE_SUMMARY_KEY } ) );

	await waitFor( () => expect( result.current.empty ).toBeUndefined() );
} );

it.each( [
	[ 'is still loading', { ...EMPTY_LIST, isLoading: true } ],
	[ 'failed', { ...EMPTY_LIST, isError: true } ],
	[ 'has rows', { ...EMPTY_LIST, isEmpty: false } ],
] )( 'does not request all-time views when the list %s', ( _case, status ) => {
	mockEmptyLists( { stats: { views: 0 } } );

	renderHook( () => useNoViewsEmptyState( status, 'None recorded.' ), {
		wrapper: queryClientWrapper,
	} );

	expect( mockApiFetch ).not.toHaveBeenCalled();
} );

it( 'shares one all-time views request between empty widgets', async () => {
	mockEmptyLists( { stats: { views: 0 } } );

	const { result: first } = renderHook(
		() => useNoViewsEmptyState( EMPTY_LIST, 'None recorded.' ),
		{ wrapper: queryClientWrapper }
	);
	const { result: second } = renderHook(
		() => useNoViewsEmptyState( EMPTY_LIST, 'None recorded.' ),
		{ wrapper: queryClientWrapper }
	);

	await waitFor( () => expect( first.current.empty ).toEqual( NONE_RECORDED ) );
	await waitFor( () => expect( second.current.empty ).toEqual( NONE_RECORDED ) );
	expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
} );
