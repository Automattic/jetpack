import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import TopicsTab from '..';

jest.mock( '@wordpress/api-fetch' );

describe( 'TopicsTab', () => {
	it( 'shows empty state when no topics exist', async () => {
		apiFetch.mockResolvedValueOnce( [] );
		render( <TopicsTab /> );
		await expect( screen.findByText( /No topics yet/ ) ).resolves.toBeInTheDocument();
	} );

	it( 'renders topic rows', async () => {
		apiFetch.mockResolvedValueOnce( [
			{
				id: 1,
				title: { rendered: 'Shipping' },
				meta: { _jstopic_keywords: 'delivery,shipping' },
				modified: '2026-04-01T00:00:00',
			},
		] );
		render( <TopicsTab /> );
		await expect( screen.findByText( 'Shipping' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'delivery,shipping' ) ).toBeInTheDocument();
	} );
} );
