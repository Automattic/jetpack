import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { setScan, useScan } from '../store';
import { deleteSoftware, fixThreat, ignoreThreat } from '../threat-actions';

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
		expect( notice ).toMatchObject( {
			type: 'snackbar',
			explicitDismiss: true,
			content: 'Ignored the threat in a.php.',
		} );
		await act( async () => notice.actions[ 0 ].onClick() );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/threats/7/unignore',
			method: 'POST',
		} );
		expect( result.current?.ignored ).toEqual( [] );
	} );
} );

describe( 'threat notices', () => {
	it( 'offer View while the action runs, which opens that threat', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const open = jest.fn();
		const fixable = { ...threat, id: 10 };

		fixThreat( fixable, open );

		const notice = select( noticesStore )
			.getNotices()
			.find( item => item.id === 'jetpack-protect-threat-action-10' );
		expect( notice ).toMatchObject( { status: 'info', content: 'Fixing the threat in a.php…' } );
		notice.actions[ 0 ].onClick();
		expect( open ).toHaveBeenCalledWith( fixable );
	} );

	it( 'keep one snackbar per threat, so acting on one doesn’t replace another’s', async () => {
		mockApiFetch.mockResolvedValue( {} );
		const other = { id: 8, title: 'Malicious code found in file: b.php' };
		setScan( current => ( { ...current, threats: [ threat, other ] } ) );

		await act( () => ignoreThreat( { ...threat, id: 9 } ) );
		await act( () => ignoreThreat( other ) );

		expect(
			select( noticesStore )
				.getNotices()
				.map( notice => notice.content )
		).toEqual(
			expect.arrayContaining( [ 'Ignored the threat in a.php.', 'Ignored the threat in b.php.' ] )
		);
	} );
} );

describe( 'deleteSoftware', () => {
	it( 'drops every threat in the deleted plugin, and only those', async () => {
		mockApiFetch.mockResolvedValue( { ok: true } );
		const inPlugin = ( id: number, slug: string ) => ( {
			id,
			title: 'Vulnerable plugin',
			extension: { type: 'plugins' as const, slug, name: slug, version: '1.0' },
		} );
		setScan( current => ( {
			...current,
			threats: [ inPlugin( 1, 'akismet' ), inPlugin( 2, 'hello' ), inPlugin( 3, 'akismet' ) ],
			ignored: [ inPlugin( 4, 'akismet' ) ],
		} ) );
		const { result } = renderHook( () => useScan() );

		await act( () => deleteSoftware( inPlugin( 1, 'akismet' ) ) );

		expect( mockApiFetch ).toHaveBeenLastCalledWith( {
			path: '/jetpack/v4/protect-dashboard/scan/software/delete',
			method: 'POST',
			data: { type: 'plugins', slug: 'akismet' },
		} );
		expect( result.current?.threats?.map( item => item.id ) ).toEqual( [ 2 ] );
		expect( result.current?.ignored ).toEqual( [] );
	} );
} );
