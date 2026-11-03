import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { setScan } from '../store';
import ThreatReport from '../threat-report';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const report: ScanState = {
	hasPlan: false,
	url: '#',
	error: false,
	scanning: false,
	lastChecked: '2026-08-15 07:00:00',
	pluginsChecked: 1,
	themesChecked: 1,
	threats: [],
};

window.jetpackProtectDashboard = { scan: report };

describe( 'ThreatReport', () => {
	it.each( [
		[ 'shows', '2026-08-15T07:00:00Z' ],
		[ 'hides', undefined ],
	] )( '%s the Detected on heading by whether threats have dates', ( _, firstDetected ) => {
		( apiFetch as unknown as jest.Mock ).mockReturnValue( new Promise( () => {} ) );
		const threat = {
			id: 3,
			title: 'Vulnerable plugin: Contact Form 7 (version 5.3.1)',
			firstDetected,
		};
		setScan( () => ( { ...report, threats: [ threat ] } ) );
		render( <ThreatReport ids={ [ '3' ] } hasHistory={ false } openTab={ jest.fn() } /> );

		const header = screen.queryByRole( 'columnheader', { name: /detected on|date/i } );
		expect( !! header ).toBe( !! firstDetected );
		expect( screen.queryByRole( 'button', { name: '' } ) ).not.toBeInTheDocument();
	} );
} );
