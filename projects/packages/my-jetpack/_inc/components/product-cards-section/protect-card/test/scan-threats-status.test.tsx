import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ScanAndThreatStatus } from '../scan-threats-status';

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

const scanData = ( lastChecked: string | null ) =>
	( {
		scanData: {
			last_checked: lastChecked,
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

describe( 'Protect card scan status with a paid plan and no threats', () => {
	it.each( [
		[ '2026-11-04 12:00:00', 'Secure' ],
		[ null, 'Not scanned yet' ],
	] )( 'with last_checked %p shows %s', ( lastChecked, status ) => {
		render( <ScanAndThreatStatus data={ scanData( lastChecked ) } /> );

		expect( screen.getByText( status ) ).toBeInTheDocument();
	} );
} );
