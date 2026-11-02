import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { DeleteSoftwareModal } from '../delete-software';
import { setScan } from '../store';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn(),
	useNavigate: () => mockNavigate,
} ) );

const inPlugin = ( id: number, slug: string ) => ( {
	id,
	title: 'Vulnerable plugin',
	extension: {
		type: 'plugins' as const,
		slug,
		name: slug,
		version: '1.0',
		actions: { delete: true },
	},
} );

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

describe( 'DeleteSoftwareModal', () => {
	it.each( [
		[ 'closes the inspector on a threat in the deleted plugin', '3', 1 ],
		[ 'leaves the inspector on a threat elsewhere', '2', 0 ],
	] )( '%s', async ( _name, open, navigations ) => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( { ok: true } );
		( useSearch as unknown as jest.Mock ).mockReturnValue( { threat: open } );
		mockNavigate.mockClear();
		setScan( current => ( {
			...current,
			threats: [ inPlugin( 1, 'akismet' ), inPlugin( 2, 'hello' ), inPlugin( 3, 'akismet' ) ],
		} ) );
		const closeModal = jest.fn();
		render(
			<DeleteSoftwareModal items={ [ inPlugin( 1, 'akismet' ) ] } closeModal={ closeModal } />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Delete plugin' } ) );

		await waitFor( () => expect( closeModal ).toHaveBeenCalled() );
		expect( mockNavigate ).toHaveBeenCalledTimes( navigations );
	} );
} );
