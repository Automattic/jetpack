import { render, screen } from '@testing-library/react';
import { CommissionFees } from '../earnings-card';

jest.mock( '../state', () => ( {
	getOverviewState: () => ( {
		upgradeUrl: 'https://example.com/upgrade',
		upgradeCommission: 0.02,
	} ),
} ) );

describe( 'CommissionFees', () => {
	it.each( [
		[ 'above', 0.04, true ],
		[ 'equal to', 0.02, false ],
	] )( 'with a fee %s the upgrade’s, offers the upgrade: %p', ( _case, commission, offers ) => {
		render( <CommissionFees commission={ commission } /> );

		expect( Boolean( screen.queryByRole( 'link', { name: 'Upgrade to lower it.' } ) ) ).toBe(
			offers
		);
	} );
} );
