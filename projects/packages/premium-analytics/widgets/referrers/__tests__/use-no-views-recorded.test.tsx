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
import { useNoViewsRecorded } from '../../use-no-views-recorded';
import ReferrersWidget from '../render';
import type { ComponentType } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = jest.mocked( apiFetch );

const GENERIC_TEXT = 'We couldn’t find results for this time period.';
const SITE_SUMMARY_PATH = /\/stats(\?|$)/;
const SITE_SUMMARY_KEY = [ 'stats', 'site' ];
const reportParams = getDefaultQueryParams( false, 'last-7-days' );

type SiteSummary = { stats: { views: number } } | Error;

/**
 * Answer every list request with no rows and the site summary with the given response.
 *
 * @param siteSummary - The `/stats` response, or the error it rejects with.
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

it( 'stops saying nothing is recorded when a refresh fails after a cached zero', async () => {
	mockEmptyLists( { stats: { views: 0 } } );
	const { result } = renderHook( () => useNoViewsRecorded( true ), {
		wrapper: queryClientWrapper,
	} );
	await waitFor( () => expect( result.current.noViewsRecorded ).toBe( true ) );

	mockEmptyLists( Object.assign( new Error( 'Forbidden' ), { data: { status: 403 } } ) );
	await act( () => queryClient.refetchQueries( { queryKey: SITE_SUMMARY_KEY } ) );

	await waitFor( () => expect( result.current.noViewsRecorded ).toBe( false ) );
} );

it( 'does not request all-time views while the widget still has no answer of its own', () => {
	mockEmptyLists( { stats: { views: 0 } } );

	renderHook( () => useNoViewsRecorded( false ), { wrapper: queryClientWrapper } );

	expect( mockApiFetch ).not.toHaveBeenCalled();
} );

it( 'shares one all-time views request between empty widgets', async () => {
	mockEmptyLists( { stats: { views: 0 } } );

	const { result: first } = renderHook( () => useNoViewsRecorded( true ), {
		wrapper: queryClientWrapper,
	} );
	const { result: second } = renderHook( () => useNoViewsRecorded( true ), {
		wrapper: queryClientWrapper,
	} );

	await waitFor( () => expect( first.current.noViewsRecorded ).toBe( true ) );
	await waitFor( () => expect( second.current.noViewsRecorded ).toBe( true ) );
	expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
} );
