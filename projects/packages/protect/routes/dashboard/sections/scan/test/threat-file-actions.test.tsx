import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { useSearch } from '@wordpress/route';
import { getScan, setScan } from '../store';
import { ThreatFileViewer, openThreatFile } from '../threat-file';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn( () => ( {} ) ),
	useNavigate: () => jest.fn(),
} ) );

const threat = {
	id: 7,
	title: 'Malicious code found in file: photo.jpg.php',
	filename: '/htdocs/wp-content/uploads/photo.jpg.php',
};
const other = { id: 8, title: 'Malicious code found in file: loose.php' };

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

describe( 'Deleting a threat file', () => {
	it( 'drops the threat from the lists', async () => {
		( useSearch as unknown as jest.Mock ).mockReturnValue( {} );
		( apiFetch as unknown as jest.Mock ).mockImplementation( ( { method } ) =>
			Promise.resolve(
				method === 'POST'
					? { ok: true }
					: {
							path: 'wp-content/uploads/photo.jpg.php',
							modified: null,
							owner: 'none',
							inUploads: true,
							canDelete: true,
							canRestore: false,
							contents: '<?php echo 1;',
						}
			)
		);
		setScan( current => ( { ...current, threats: [ threat, other ], ignored: [ threat ] } ) );
		render( <ThreatFileViewer /> );
		act( () => openThreatFile( threat ) );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Delete file' } ) );
		const confirm = screen.getAllByRole( 'button', { name: 'Delete file' } ).pop();
		await userEvent.click( confirm as HTMLElement );

		await waitFor( () => expect( getScan()?.threats ).toEqual( [ other ] ) );
		expect( getScan()?.ignored ).toEqual( [] );
	} );
} );
