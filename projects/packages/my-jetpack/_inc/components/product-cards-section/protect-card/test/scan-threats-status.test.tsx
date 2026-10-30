import '@testing-library/jest-dom';
import { render, renderHook, screen } from '@testing-library/react';
import { ScanAndThreatStatus } from '../scan-threats-status';
import { useLastScanText } from '../use-last-scan-text';

jest.mock( '../../../../data/products/use-product', () => ( {
	__esModule: true,
	default: () => ( { detail: { isPluginActive: true, hasPaidPlanForProduct: true } } ),
} ) );

jest.mock( '../../../../hooks/use-my-jetpack-connection', () => ( {
	__esModule: true,
	default: () => ( { isSiteConnected: true } ),
} ) );

jest.mock( '../../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );

jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { plugins: {}, themes: {} } ),
} ) );

const scanData = ( lastScanFailed: boolean ) =>
	( {
		scanData: {
			last_checked: new Date().toISOString(),
			last_scan_failed: lastScanFailed,
			num_threats: 0,
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
		[ false, 'Secure', /^Last scan: / ],
		[ true, 'Incomplete', /^Last scan didn’t complete$/ ],
	] )( 'with last_scan_failed %s shows %s', ( lastScanFailed, status, lastScanText ) => {
		const data = scanData( lastScanFailed );
		render( <ScanAndThreatStatus data={ data } /> );

		expect( screen.getByText( status ) ).toBeInTheDocument();
		expect( renderHook( () => useLastScanText( data ) ).result.current ).toMatch( lastScanText );
	} );
} );
