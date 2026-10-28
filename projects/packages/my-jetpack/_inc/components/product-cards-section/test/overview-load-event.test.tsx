import { render } from '@testing-library/react';
import BoostOverviewItem from '../boost-card/overview';
import ProtectOverviewItem from '../protect-card/overview';
import StatsOverviewItem from '../stats-card/overview';
import type { FC } from 'react';

const mockRecordEvent = jest.fn();
let mockProductStatus = 'active';
let mockStatsVisits = {};

jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: mockRecordEvent } ) );
jest.mock( '../../../hooks/use-my-jetpack-connection', () => () => ( {
	blogID: '1',
	isSiteConnected: true,
} ) );
jest.mock( '../../../data/products/use-product', () => () => ( {
	detail: { status: mockProductStatus, manageUrl: 'https://example.org/manage' },
	isLoading: false,
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [] },
} ) );
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {} } ),
} ) );
jest.mock( '../../../hooks/use-stats-visits', () => () => mockStatsVisits );
jest.mock( '../overview-item/use-status-action', () => () => ( { isPending: false } ) );
jest.mock( '../stats-card/overview-stats', () => () => null );
jest.mock( '../../../data/use-simple-query', () => () => ( {
	data: { scanData: { num_threats: 0 }, wafConfig: {} },
	isLoading: false,
	isFetching: false,
	isError: false,
} ) );
jest.mock( '../boost-card/use-boost-speed-score', () => () => ( {
	isLoading: false,
	isSiteConnected: true,
	speedLetterGrade: 'B',
	currentSpeedScore: 83,
	isSpeedScoreError: false,
	retry: jest.fn(),
} ) );

const StatsItem: FC< { admin: boolean } > = props => (
	<StatsOverviewItem { ...props } period={ { days: 7, end: new Date() } } />
);

const loaded = {
	data: { fields: [], data: [] },
	isLoading: false,
	isFetching: false,
	isError: false,
};

describe( 'Overview load event', () => {
	beforeEach( () => mockRecordEvent.mockClear() );

	it.each< [ string, FC< { admin: boolean } >, string, object ] >( [
		[ 'Stats, loaded', StatsItem, 'active', loaded ],
		[ 'Stats, switched off', StatsItem, 'module_disabled', loaded ],
		[ 'Stats, failed', StatsItem, 'active', { ...loaded, data: undefined, isError: true } ],
		[ 'Protect', ProtectOverviewItem, 'active', loaded ],
		[ 'Boost', BoostOverviewItem, 'active', loaded ],
	] )( 'records it once for %s', ( _, Item, status, visits ) => {
		mockProductStatus = status;
		mockStatsVisits = visits;
		render( <Item admin /> );

		expect(
			mockRecordEvent.mock.calls.filter(
				( [ name ] ) => name === 'jetpack_myjetpack_product_card_load'
			)
		).toHaveLength( 1 );
	} );
} );
