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
jest.mock( '../stats-card/overview-stats', () => ( { isLoading, counts, previousCounts } ) => (
	<div>
		{ isLoading ? 'Stats skeleton' : `${ counts.views } views, ${ previousCounts?.views } before` }
	</div>
) );

describe( 'StatsOverviewItem', () => {
	it( 'shows the Stats skeleton while the product status loads', () => {
		render( <StatsOverviewItem admin period={ { days: 7, end: new Date() } } /> );

		expect( screen.getByText( 'Stats skeleton' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Views in the last 7 days' ) ).not.toBeInTheDocument();
	} );

	it( 'passes the previous period from the same response', () => {
		mockProduct = { detail: { name: 'Stats', status: 'active' }, isLoading: false };
		mockVisits = {
			isLoading: false,
			isFetching: false,
			isError: false,
			data: {
				fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ],
				data: Array.from( { length: 14 }, ( _, day ) => [
					`2026-11-${ String( day + 1 ).padStart( 2, '0' ) }`,
					day < 7 ? 10 : 20,
					0,
					0,
					0,
				] ),
			},
		};
		render( <StatsOverviewItem admin period={ { days: 7, end: new Date() } } /> );

		expect( screen.getByText( '140 views, 70 before' ) ).toBeInTheDocument();
	} );
} );
