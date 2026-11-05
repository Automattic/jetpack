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

const scanData = ( lastScanFailed?: boolean, numThreats = 0 ) =>
	( {
		scanData: {
			last_checked: new Date().toISOString(),
			last_scan_failed: lastScanFailed,
			num_threats: numThreats,
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
