/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import SharesWidget from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsSite: jest.fn(),
} ) );

const mockUseStatsSite = jest.mocked( useStatsSite );

// Eleven networks, one more than the card lists.
const SERVICES = [
	'facebook',
	'twitter',
	'linkedin',
	'tumblr',
	'pinterest',
	'reddit',
	'pocket',
	'telegram',
	'whatsapp',
	'skype',
	'email',
];

function siteResult(
	stats: Record< string, number > | undefined,
	overrides: Record< string, unknown > = {}
) {
	return {
		data: stats && { stats },
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsSite >;
}

const STATS = Object.fromEntries(
	SERVICES.map( ( service, index ) => [ `shares_${ service }`, 100 - index ] )
);

describe( 'SharesWidget CSV download', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeEach( () => {
		jest.useFakeTimers();
		mockUseStatsSite.mockReset();
	} );

	afterEach( () => {
		downloads?.restore();
		downloads = undefined;
		jest.useRealTimers();
	} );

	it( 'saves every network, past the ones the card lists', async () => {
		downloads = captureCsvDownloads();
		mockUseStatsSite.mockReturnValue( siteResult( STATS ) );

		const { findDeclaredAction } = renderWithActionsHost( <SharesWidget attributes={ {} } /> );
		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );
		const lines = await downloads.lines();

		expect( downloads.files[ 0 ].filename ).toBe( 'shares.csv' );
		expect( lines ).toHaveLength( SERVICES.length + 1 );
		expect( lines.slice( 0, 2 ) ).toEqual( [ '"Platform","Shares"', '"Facebook","100"' ] );
		expect( lines.at( -1 ) ).toBe( '"Email","90"' );
		expect( screen.getByText( 'Skype' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Email' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'no network recorded a share', siteResult( { shares_facebook: 0, shares_twitter: 0 } ) ],
		[ 'a refetch failed behind the rows on screen', siteResult( STATS, { isError: true } ) ],
	] )( 'offers no download when %s', ( _, result ) => {
		mockUseStatsSite.mockReturnValue( result );

		const { declaredAction } = renderWithActionsHost( <SharesWidget attributes={ {} } /> );

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );
} );
