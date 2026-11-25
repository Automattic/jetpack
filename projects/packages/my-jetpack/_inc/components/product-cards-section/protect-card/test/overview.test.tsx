import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProtectOverviewItem from '../overview';

let mockData: Partial< ProtectData >;

jest.mock( '../../../../hooks/use-my-jetpack-connection', () => () => ( {
	isSiteConnected: true,
} ) );
jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: {
		status: 'active',
		isPluginActive: true,
		hasPaidPlanForProduct: true,
		manageUrl: 'https://example.org/manage',
	},
	isLoading: false,
} ) );
jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {} } ),
} ) );
jest.mock( '../../overview-item/use-status-action', () => () => ( { isPending: false } ) );
jest.mock( '../../../../data/use-simple-query', () => () => ( {
	data: mockData,
	isLoading: false,
	isFetching: false,
	isError: false,
} ) );

const threats = [ { id: 1 }, { id: 2 } ] as unknown as ThreatItem[];

describe( 'Protect Overview item with Scan', () => {
	it.each( [
		[ "Protect's count, without a threat the site fixed", 1, '1' ],
		[ 'the threat list when Protect has no count', null, '2' ],
	] )( 'shows %s', ( _, threatCount, shown ) => {
		mockData = { scanData: { threats } as ProtectData[ 'scanData' ], threatCount };
		render( <ProtectOverviewItem admin /> );

		expect( screen.getByText( shown ) ).toBeInTheDocument();
	} );
} );
