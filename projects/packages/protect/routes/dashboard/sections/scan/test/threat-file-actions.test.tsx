import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
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
	it.each( [
		[ 'the threat', { threat }, [ other ] ],
		[ 'the threat and the others found in the file', { threat, others: [ 8 ] }, [] ],
	] )( 'drops %s from the lists', async ( _name, deleted, remaining ) => {
		( apiFetch as unknown as jest.Mock ).mockImplementation( ( { method } ) =>
			Promise.resolve(
				method === 'POST'
					? deleted
					: {
							path: 'wp-content/uploads/photo.jpg.php',
							modified: null,
							owner: 'none',
							inUploads: true,
							canDelete: true,
							canRestore: false,
							contents: '<?php echo 1;',
							hash: 'abc',
						}
			)
		);
		setScan( current => ( {
			...current,
			threats: [ threat, other ],
			ignored: [ threat, other ],
		} ) );
		render( <ThreatFileViewer /> );
		act( () => openThreatFile( threat ) );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Delete file' } ) );
		const confirm = screen.getAllByRole( 'button', { name: 'Delete file' } ).pop();
		await userEvent.click( confirm as HTMLElement );

		await waitFor( () => expect( getScan()?.threats ).toEqual( remaining ) );
		expect( apiFetch ).toHaveBeenCalledWith( expect.objectContaining( { data: { hash: 'abc' } } ) );
		expect( getScan()?.ignored ).toEqual( remaining );
	} );
} );
