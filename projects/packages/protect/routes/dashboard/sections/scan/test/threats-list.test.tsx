import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { DataViews } from '@wordpress/dataviews';
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
} );
