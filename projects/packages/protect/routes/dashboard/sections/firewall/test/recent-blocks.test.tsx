import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecentBlocks from '../recent-blocks';

const block = {
	id: 1,
	timestamp: '2026-10-09T16:54:03Z',
	ruleId: -1,
	reason: 'ip block list',
};

describe( 'RecentBlocks', () => {
	it( 'lists every block in a dialog', async () => {
		render(
			<RecentBlocks
				blocks={ [ { ...block, id: 2, ruleId: -2, reason: 'firewall test' }, block ] }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'View blocked requests' } ) );

		const dialog = await screen.findByRole( 'dialog', { name: 'Recently blocked requests' } );
		expect( dialog ).toHaveTextContent( 'Firewall test' );
		expect( dialog ).toHaveTextContent( 'Blocked IP address' );
	} );

	it( 'has nothing to open before anything is blocked', () => {
		render( <RecentBlocks blocks={ [] } /> );

		expect( screen.getByText( 'No blocked requests yet.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
