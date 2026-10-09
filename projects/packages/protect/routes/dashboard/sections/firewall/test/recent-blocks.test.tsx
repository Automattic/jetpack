import { render, screen } from '@testing-library/react';
import RecentBlocks from '../recent-blocks';

const block = {
	id: 1,
	timestamp: '2026-10-09T16:54:03Z',
	ruleId: -1,
	reason: 'ip block list',
	method: null,
	uri: null,
	userAgent: null,
};

describe( 'RecentBlocks', () => {
	it( 'shows the request a block stopped', () => {
		render(
			<RecentBlocks
				blocks={ [ { ...block, method: 'GET', uri: '/?page_id=1', userAgent: 'curl/8.14.1' } ] }
			/>
		);

		expect( screen.getByText( 'GET /?page_id=1' ) ).toBeInTheDocument();
		expect( screen.getByText( 'curl/8.14.1' ) ).toBeInTheDocument();
	} );

	it( 'shows a block logged before request details were kept', () => {
		render( <RecentBlocks blocks={ [ block ] } /> );

		expect( screen.getByText( 'Blocked IP address' ) ).toBeInTheDocument();
		expect( screen.queryByText( /^GET / ) ).not.toBeInTheDocument();
	} );
} );
