import { render, screen } from '@testing-library/react';
import StatsOverviewItem from '../stats-card/overview';

jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {
	blogID: '1',
	isSiteConnected: true,
} ) );
let mockProduct: object = { detail: { name: 'Stats' }, isLoading: true };
jest.mock( '../../../data/products/use-product', () => () => mockProduct );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [] },
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {} ),
} ) );
let mockVisits: object = { isLoading: false, isFetching: false, isError: false };
jest.mock( '../../../hooks/use-stats-visits', () => () => mockVisits );
jest.mock( '../overview-item/use-status-action', () => () => ( { forcedOffReason: null } ) );
jest.mock( '../stats-card/overview-stats', () => ( { isLoading, counts, comparison } ) => (
	<div>
		{ isLoading
			? 'Stats skeleton'
			: `${ counts.views } views; ${ comparison.counts.views } vs ${ comparison.previousCounts.views }` }
	</div>
) );

describe( 'StatsOverviewItem', () => {
	it( 'shows the Stats skeleton while the product status loads', () => {
		render( <StatsOverviewItem admin period={ { days: 7, end: new Date(), offset: 0 } } /> );

		expect( screen.getByText( 'Stats skeleton' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Views in the last 7 days' ) ).not.toBeInTheDocument();
	} );

	// Nov 1–7 have 10 views a day, Nov 8–14 have 20, and Nov 15 (the latest day) has 5.
	it.each( [
		[ 0, '125 views; 140 vs 70' ],
		[ 1, '125 views; 125 vs 80' ],
	] )( 'compares complete periods from one response at offset %d', ( offset, expected ) => {
		mockProduct = { detail: { name: 'Stats', status: 'active' }, isLoading: false };
		mockVisits = {
			isLoading: false,
			isFetching: false,
			isError: false,
			data: {
				fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ],
				data: Array.from( { length: 15 }, ( _, day ) => [
					`2026-11-${ String( day + 1 ).padStart( 2, '0' ) }`,
					[ 10, 20, 5 ][ Math.floor( day / 7 ) ],
					0,
					0,
					0,
				] ),
			},
		};
		render( <StatsOverviewItem admin period={ { days: 7, end: new Date(), offset } } /> );

		expect( screen.getByText( expected ) ).toBeInTheDocument();
	} );
} );
