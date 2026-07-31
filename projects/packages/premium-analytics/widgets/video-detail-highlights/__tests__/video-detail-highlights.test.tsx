/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import VideoDetailHighlightsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function buildSingleVideoResponse( values: number[] ) {
	return {
		data: values.map( ( value, index ) => [
			`2026-05-${ String( index + 1 ).padStart( 2, '0' ) }`,
			value,
		] ),
		pages: [],
		post: {
			ID: 105,
			post_title: 'Selected video',
			post_mime_type: 'video/mp4',
		},
	};
}

const VIEWS_RESPONSE = buildSingleVideoResponse( [ 999, ...Array( 28 ).fill( 0 ), 40, 88 ] );
const IMPRESSIONS_RESPONSE = buildSingleVideoResponse( [ 200, 256 ] );
const WATCH_TIME_RESPONSE = buildSingleVideoResponse( [ 6.3, 12.6 ] );

function responseForPath( path: string ) {
	if ( path.includes( 'statType=impressions' ) ) {
		return IMPRESSIONS_RESPONSE;
	}

	if ( path.includes( 'statType=watch_time' ) ) {
		return WATCH_TIME_RESPONSE;
	}

	return VIEWS_RESPONSE;
}

// The WPCOM pass-through error envelope, with the status attached the way the
// fetch layer attaches it.
const MOCK_API_ERROR = {
	error: 'unauthorized',
	message: 'Mocked error response.',
	status: 403,
};

function renderWidget( postId?: number, withComparison = false ) {
	return render(
		<VideoDetailHighlightsWidget
			attributes={ {
				reportParams: {
					from: '2026-07-01',
					to: '2026-07-07',
					interval: 'day',
					...( withComparison
						? {
								comp: '1',
								compare_from: '2026-06-24',
								compare_to: '2026-06-30',
						  }
						: {} ),
					...( postId === undefined ? {} : { post_id: postId } ),
				},
			} }
		/>
	);
}

describe( 'VideoDetailHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( responseForPath( path ) )
		);
	} );

	it( 'renders the three trailing-30-day metrics from per-video requests', async () => {
		renderWidget( 105 );

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();

		const tiles = screen.getAllByRole( 'listitem' );
		expect( tiles ).toHaveLength( 3 );
		expect( tiles[ 0 ] ).toHaveTextContent( 'Views128' );
		expect( tiles[ 1 ] ).toHaveTextContent( 'Impressions456' );
		expect( tiles[ 2 ] ).toHaveTextContent( 'Hours watched18.9' );

		const allPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		const requestedPaths = allPaths.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 3 );
		expect( requestedPaths.every( path => path.includes( 'period=month' ) ) ).toBe( true );
		expect( requestedPaths.some( path => path.includes( 'statType=impressions' ) ) ).toBe( true );
		expect( requestedPaths.some( path => path.includes( 'statType=watch_time' ) ) ).toBe( true );
		expect( allPaths.some( path => path.includes( 'stats/video-plays' ) ) ).toBe( false );
	} );

	it( 'does not issue extra requests for comparison report params the endpoint cannot use', async () => {
		renderWidget( 105, true );

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /^[+-]\d+%$/ ) ).not.toBeInTheDocument();

		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 3 );
		expect( requestedPaths.every( path => ! path.includes( 'date=' ) ) ).toBe( true );
		expect( requestedPaths.every( path => ! path.includes( 'start_date=' ) ) ).toBe( true );
	} );

	it( 'renders the scope-empty state and skips fetching without a post_id', () => {
		renderWidget();

		expect( screen.getByText( /open a video report/i ) ).toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'renders an error state with a Retry action', async () => {
		mockApiFetch.mockRejectedValue( MOCK_API_ERROR );
		renderWidget( 105 );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			/couldn't load this video's highlights/i
		);

		const requestsBeforeRetry = mockApiFetch.mock.calls.length;
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve( responseForPath( path ) )
		);
		fireEvent.click( screen.getByRole( 'button', { name: /retry/i } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( '128' ) ).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls.length ).toBeGreaterThan( requestsBeforeRetry );
	} );
} );
