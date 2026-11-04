import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { DataViews } from '@wordpress/dataviews';
import { resetScan } from '../store';
import { fixThreat, ignoreThreat } from '../threat-actions';
import ThreatsList, { createThreatView, getThreatFields } from '../threats-list';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const getItemId = ( item: ScanThreat ) => String( item.id );

const vulnerable = (
	id: number,
	fixer: 'replace' | 'update' | 'delete',
	isBulkFixable = true
): ScanThreat => ( {
	id,
	signature: 'Vulnerable.WP.Extension',
	title: 'Vulnerable plugin',
	status: 'current',
	fixable: { fixer, target: '2.0', extras: { isBulkFixable } },
	extension: { type: 'plugins', slug: `plugin-${ id }`, name: `Plugin ${ id }`, version: '1.0' },
} );

const selectAll = async ( threats: ScanThreat[] ) => {
	for ( const threat of threats ) {
		await userEvent.click(
			screen.getByRole( 'checkbox', { name: `Vulnerable plugin: Plugin ${ threat.id } (1.0)` } )
		);
	}
	// eslint-disable-next-line testing-library/no-node-access -- DataViews gives its bulk toolbar no role.
	return document.querySelector( '.dataviews-bulk-actions__actions' ) as HTMLElement;
};

describe( 'ThreatsList', () => {
	it.each( [
		[ 'Fixing…', 1, fixThreat ],
		[ 'Ignoring…', 2, ignoreThreat ],
	] )( 'shows %s in place of the date while the action runs', ( status, id, start ) => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const threat: ScanThreat = {
			id,
			title: 'Malicious code found in file: a.php',
			fixable: { fixer: 'replace' },
			firstDetected: '2026-08-15T07:00:00Z',
		};
		render( <ThreatsList threats={ [ threat ] } canAct /> );
		expect( screen.getByText( 'Aug 15, 7:00 AM' ) ).toBeInTheDocument();

		act( () => void start( threat ) );

		expect( screen.getByText( status ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Aug 15, 7:00 AM' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'date', { firstDetected: undefined } ],
		[ 'severity', { severity: null } ],
	] )( 'shows a dash for a threat with no %s', ( fieldId, missing ) => {
		const threat: ScanThreat = { id: 3, title: 'Vulnerable plugin', ...missing };
		const fields = getThreatFields( jest.fn(), {
			threatLabel: 'Threat',
			dateLabel: 'Detected on',
			getDate: item => item.firstDetected ?? '',
		} );
		render(
			<DataViews
				data={ [ threat ] }
				fields={ fields }
				view={ { ...createThreatView( 'severity' ), fields: [ fieldId ] } }
				onChangeView={ jest.fn() }
				paginationInfo={ { totalItems: 1, totalPages: 1 } }
				defaultLayouts={ { table: {} } }
				getItemId={ getItemId }
			/>
		);

		expect( screen.getByText( '—' ) ).toBeInTheDocument();
	} );

	it( 'shows no severity for a threat without one, as from the free vulnerability check', () => {
		const threat: ScanThreat = { id: 3, title: 'Vulnerable plugin', severity: null };
		render( <ThreatsList threats={ [ threat ] } canAct /> );

		expect( screen.getByText( 'Vulnerable plugin' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Low' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[
			'tells an update from other fixes',
			[ vulnerable( 11, 'update' ), vulnerable( 12, 'replace' ) ],
			[ 'Auto-fix', 'Auto-fix 1 update', 'Ignore' ],
		],
		[
			'offers no Auto-fix for updates Scan runs only one at a time',
			[ vulnerable( 11, 'update', false ), vulnerable( 12, 'update', false ) ],
			[ 'Ignore' ],
		],
	] )( 'in the bulk toolbar, %s', async ( _name, threats, expected ) => {
		render( <ThreatsList threats={ threats } canAct /> );

		const toolbar = await selectAll( threats );

		expect(
			within( toolbar )
				.getAllByRole( 'button' )
				.map( button => button.textContent )
		).toEqual( expected );
	} );

	it.each( [
		[ 'a delete fix', [ vulnerable( 21, 'replace' ), vulnerable( 22, 'delete' ) ], [ 22 ] ],
		[
			'an update Scan runs only on its own',
			[ vulnerable( 23, 'update' ), vulnerable( 24, 'update', false ) ],
			[ 24 ],
		],
		[
			'nothing when each bulk Auto-fix gets one threat',
			[ vulnerable( 25, 'replace', false ), vulnerable( 26, 'update', false ) ],
			[],
		],
	] )( 'lists the selected threats bulk Auto-fix leaves out: %s', async ( _name, threats, ids ) => {
		render( <ThreatsList threats={ threats } canAct /> );

		await selectAll( threats );

		const listed = screen
			.queryAllByRole( 'listitem' )
			.map( item => item.textContent )
			.filter( text => text?.startsWith( 'Plugin' ) );
		expect( listed ).toEqual( ids.map( id => `Plugin ${ id } (1.0)` ) );
	} );

	it( 'counts only the updates a batch runs, on the button and in the confirmation', async () => {
		const threats = [
			vulnerable( 11, 'update' ),
			vulnerable( 12, 'update' ),
			vulnerable( 13, 'update', false ),
		];
		render( <ThreatsList threats={ threats } canAct /> );

		await userEvent.click(
			within( await selectAll( threats ) ).getByRole( 'button', { name: 'Auto-fix 2 updates' } )
		);

		expect( screen.getByRole( 'heading', { name: 'Apply 2 updates?' } ) ).toBeInTheDocument();
	} );

	it( 'keeps updates Scan runs only on their own selectable where the host turns off ignoring', async () => {
		window.jetpackProtectDashboard = { scan: { hasPlan: true, url: '', canIgnore: false } };
		resetScan();
		const threats = [ vulnerable( 14, 'update', false ), vulnerable( 15, 'update', false ) ];
		render( <ThreatsList threats={ threats } canAct /> );

		await selectAll( threats );

		expect(
			screen.getAllByRole( 'checkbox', { name: /^Vulnerable plugin/, checked: true } )
		).toHaveLength( 2 );
		delete window.jetpackProtectDashboard;
		resetScan();
	} );
} );
