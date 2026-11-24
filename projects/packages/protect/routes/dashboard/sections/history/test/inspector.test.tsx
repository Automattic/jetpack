import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { editScan, resetScan } from '../../scan/store';
import HistoryInspector from '../inspector';
import { loadHistory, resetHistory } from '../store';
import type { ScanState, ScanThreat } from '../../scan/types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( { historyThreat: '2' } ),
	useNavigate: () => jest.fn(),
} ) );

const ignored = {
	id: 2,
	title: 'Malicious code found in file: a.php',
	filename: '/a.php',
	status: 'ignored',
} as ScanThreat;

afterEach( () => {
	delete window.jetpackProtectDashboard;
	resetScan();
	resetHistory();
} );

it.each( [
	[ 'Scan', 'keeps', true, 0 ],
	[ 'the free check', 'drops', false, 1 ],
] )(
	'with %s, the History inspector %s a threat unignored elsewhere',
	async ( _name, _verb, hasPlan, gone ) => {
		window.jetpackProtectDashboard = {
			scan: { hasPlan, freeIgnore: true, threats: [], ignored: [ ignored ] } as ScanState,
		};
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( [ ignored ] );
		await act( () => loadHistory() );
		render( <HistoryInspector /> );

		act( () => editScan( scan => ( { ...scan, threats: [ ignored ], ignored: [] } ) ) );

		expect( screen.queryAllByRole( 'button', { name: 'Unignore it' } ) ).toHaveLength( 0 );
		expect( screen.queryAllByText( 'Scan history no longer lists this threat.' ) ).toHaveLength(
			gone
		);
	}
);
