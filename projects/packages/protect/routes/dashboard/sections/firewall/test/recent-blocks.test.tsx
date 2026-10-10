import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecentBlocks from '../recent-blocks';
import type { BlockedRequest } from '../types';

const block = {
	id: 1,
	timestamp: '2026-10-09T16:54:03Z',
	ruleId: -1,
	reason: 'ip block list',
};

const openDialog = async ( blocks: BlockedRequest[] ) => {
	render( <RecentBlocks blocks={ blocks } canViewAll /> );
	await userEvent.click( screen.getByRole( 'button', { name: 'View blocked requests' } ) );
	return screen.findByRole( 'dialog', { name: 'Recently blocked requests' } );
};

describe( 'RecentBlocks', () => {
	it( 'lists every block in a dialog', async () => {
		const dialog = await openDialog( [
			{ ...block, id: 2, ruleId: -2, reason: 'firewall test' },
			block,
		] );

		expect( dialog ).toHaveTextContent( 'Firewall test' );
		expect( dialog ).toHaveTextContent( 'Blocked IP address' );
		expect( screen.queryByRole( 'columnheader', { name: 'Request' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the request details the log kept', async () => {
		const dialog = await openDialog( [
			{
				...block,
				id: 2,
				uri: '/?page_id=1',
				userAgent:
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:157.0) Gecko/20100101 Firefox/157.0',
			},
			block,
		] );

		expect( screen.getByRole( 'columnheader', { name: 'Request' } ) ).toBeInTheDocument();
		expect( dialog ).toHaveTextContent( '/?page_id=1' );
		expect( dialog ).toHaveTextContent( 'Firefox · macOS' );
	} );

	it.each( [
		[ 'before anything is blocked', [], true ],
		[ 'while the firewall keeps no request log', [ block ], false ],
	] )( 'has nothing to open %s', ( _, blocks: BlockedRequest[], canViewAll: boolean ) => {
		render( <RecentBlocks blocks={ blocks } canViewAll={ canViewAll } /> );

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );
