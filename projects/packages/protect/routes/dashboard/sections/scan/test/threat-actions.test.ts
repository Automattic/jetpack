import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useScan } from '../store';
import { ignoreThreat } from '../threat-actions';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const threat = { id: 7, title: 'Malicious code found in file: a.php' };

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [ threat ], ignored: [] },
};

describe( 'ignoreThreat', () => {
	it( 'moves the threat to the ignored list, and the notice’s Undo unignores it', async () => {
		mockApiFetch.mockResolvedValue( { hasPlan: true, url: '#', error: false, threats: [] } );
		const { result } = renderHook( () => useScan() );

		await act( () => ignoreThreat( threat ) );

		expect( result.current?.threats ).toEqual( [] );
		expect( result.current?.ignored ).toEqual( [ { ...threat, status: 'ignored' } ] );

		const [ notice ] = select( noticesStore ).getNotices();
		expect( notice ).toMatchObject( { type: 'snackbar', content: 'Threat ignored.' } );
		await act( async () => notice.actions[ 0 ].onClick() );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/threats/7/unignore',
			method: 'POST',
		} );
		expect( result.current?.ignored ).toEqual( [] );
	} );
} );
