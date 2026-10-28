import { render, screen } from '@testing-library/react';
import StatsOverviewItem from '../stats-card/overview';

jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {
	blogID: '1',
	isSiteConnected: true,
} ) );
jest.mock( '../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats' },
	isLoading: true,
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [] },
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {} ),
} ) );
jest.mock( '../../../hooks/use-stats-visits', () => () => ( {
	isLoading: false,
	isFetching: false,
	isError: false,
} ) );
jest.mock( '../overview-item/use-status-action', () => () => ( { forcedOffReason: null } ) );
jest.mock( '../stats-card/overview-stats', () => ( { isLoading } ) => (
	<div>{ isLoading ? 'Stats skeleton' : 'Stats' }</div>
) );

describe( 'StatsOverviewItem', () => {
	it( 'shows the Stats skeleton while the product status loads', () => {
		render( <StatsOverviewItem admin period={ { days: 7, end: new Date() } } /> );

		expect( screen.getByText( 'Stats skeleton' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Views in the last 7 days' ) ).not.toBeInTheDocument();
	} );
} );
