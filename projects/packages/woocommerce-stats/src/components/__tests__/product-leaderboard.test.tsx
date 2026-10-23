/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useProductDetails } from '../../reports';
import { ProductLeaderboard } from '../product-leaderboard';

const mockLeaderboard = jest.fn();

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	Leaderboard: ( props: unknown ) => {
		mockLeaderboard( props );
		return null;
	},
	describeError: jest.fn(),
	useWidgetRootContext: () => ( { reportParams: {} } ),
} ) );

jest.mock( '../../reports', () => ( {
	useProductDetails: jest.fn(),
	useReportProducts: () => ( {
		primary: {
			data: {
				data: [
					{ product_id: 20, product_name: 'Hoodie', product_net_revenue: 50 },
					{ product_id: 31, product_name: 'Gone', product_net_revenue: 10 },
				],
			},
		},
		comparison: { data: undefined },
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		error: null,
		refetch: jest.fn(),
	} ),
} ) );

const mockUseProductDetails = useProductDetails as jest.Mock;

const HOODIE = { image: { url: 'hoodie.jpg', alt: '' }, permalink: 'https://shop.test/hoodie/' };

const renderRows = ( primary: { data?: Record< number, typeof HOODIE >; isError: boolean } ) => {
	mockUseProductDetails.mockReturnValue( { primary, isFetching: false } );

	render(
		<ProductLeaderboard
			filter={ { key: 'product_type', compare: '=', value: 'simple' } }
			errorText="Could not load products."
			chartTitle="Top performing products"
		/>
	);

	return mockLeaderboard.mock.lastCall[ 0 ];
};

it.each( [
	[
		'answered without the deleted one',
		{ data: { 20: HOODIE }, isError: false },
		{ kind: 'postLink', id: 20, href: 'https://shop.test/hoodie/' },
	],
	[ 'failed', { data: undefined, isError: true }, undefined ],
] )( 'links only the products the products request %s', ( _name, primary, firstAction ) => {
	const { rows } = renderRows( primary );

	expect( rows[ 0 ].action ).toEqual( firstAction );
	expect( rows[ 1 ].action ).toBeUndefined();
} );

it( 'shows each thumbnail it found, named after its product when the store gave no alt', () => {
	const { rows } = renderRows( { data: { 20: HOODIE }, isError: false } );

	expect( rows.map( ( row: { media: unknown } ) => row.media ) ).toEqual( [
		{ kind: 'thumbnail', url: 'hoodie.jpg', alt: 'Hoodie' },
		{ kind: 'thumbnail', url: undefined, alt: 'Gone' },
	] );
} );

it( 'keeps the widget out of its error state when only the products request failed', () => {
	const { status } = renderRows( { data: undefined, isError: true } );

	expect( status.isError ).toBe( false );
} );
