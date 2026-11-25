import '@testing-library/jest-dom';
import { render, renderHook, screen } from '@testing-library/react';
import { ScanAndThreatStatus } from '../scan-threats-status';
import { useLastScanText } from '../use-last-scan-text';

let mockHasPaidPlan = true;
jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { detail: { isPluginActive: true, hasPaidPlanForProduct: mockHasPaidPlan } } ),
} ) );

jest.mock( '../../../../hooks/use-my-jetpack-connection', () => ( {
	__esModule: true,
	default: () => ( { isSiteConnected: true } ),
} ) );

jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {}, themes: {} } ),
} ) );

const scanData = (
	lastScanFailed?: boolean,
	numThreats = 0,
	lastChecked: string | null = new Date().toISOString()
) =>
	( {
		scanData: {
			last_checked: lastChecked,
			last_scan_failed: lastScanFailed,
			num_threats: numThreats,
			threats: Array.from( { length: numThreats }, ( _, id ) => ( { id, severity: 1 } ) ),
			num_plugins_threats: 0,
			num_themes_threats: 0,
			plugins: [],
			themes: [],
			core: { threats: [] },
			files: [],
			database: [],
		},
	} ) as unknown as ProtectData;

describe( 'Protect card scan status', () => {
	it.each( [
		[ false, 0, 'Secure', /^Last scan: / ],
		[ undefined, 0, 'Secure', /^Last scan: / ],
		[ true, 0, 'Incomplete', /^Last scan didn’t complete$/ ],
		[ true, 2, 'Threats', /^Last scan didn’t complete$/ ],
	] )(
		'with last_scan_failed %s and %d threats shows %s',
		( lastScanFailed, numThreats, status, lastScanText ) => {
			const data = scanData( lastScanFailed, numThreats );
			render( <ScanAndThreatStatus data={ data } /> );

			expect( screen.getAllByText( status )[ 0 ] ).toBeInTheDocument();
			expect( renderHook( () => useLastScanText( data ) ).result.current ).toMatch( lastScanText );
		}
	);
} );

describe( 'Protect card scan status with a paid plan and no threats', () => {
	it.each( [
		[ '2026-11-04 12:00:00', 'Secure' ],
		[ null, 'Not scanned yet' ],
	] )( 'with last_checked %p shows %s', ( lastChecked, status ) => {
		render( <ScanAndThreatStatus data={ scanData( false, 0, lastChecked ) } /> );

		expect( screen.getByText( status ) ).toBeInTheDocument();
	} );
} );

describe( 'Protect card threat count', () => {
	afterEach( () => {
		mockHasPaidPlan = true;
	} );

	it( 'counts affected items, not the free report’s vulnerabilities', () => {
		mockHasPaidPlan = false;
		const data = scanData( false, 1 );
		data.scanData.num_threats = 5;
		render( <ScanAndThreatStatus data={ data } /> );

		expect( screen.getByText( '1' ) ).toBeInTheDocument();
		expect( screen.queryByText( '5' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 2, 1, [ '2', '1' ] ],
		[ 0, 0, [ 'Secure' ] ],
	] )(
		'leaves out threats the site fixed: %d open, %d critical',
		( threatCount, criticalThreatCount, texts ) => {
			const data = scanData( false, 3 );
			render( <ScanAndThreatStatus data={ { ...data, threatCount, criticalThreatCount } } /> );

			texts.forEach( text => expect( screen.getByText( text ) ).toBeInTheDocument() );
			expect( screen.queryByText( '3' ) ).not.toBeInTheDocument();
		}
	);
} );
