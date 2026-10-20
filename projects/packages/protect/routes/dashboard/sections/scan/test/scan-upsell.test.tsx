import analytics from '@automattic/jetpack-analytics';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScanUpsell from '../scan-upsell';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

const recordEvent = analytics.tracks.recordEvent as jest.Mock;

describe( 'ScanUpsell', () => {
	it.each( [
		[ 3, 3, 'Check my whole site' ],
		[ 99, 1, 'Upgrade' ],
	] )(
		'tags the view and the click with the copy shown (variant %d)',
		async ( given, shown, button ) => {
			recordEvent.mockClear();
			window.localStorage.clear();
			render( <ScanUpsell variant={ given } url="#buy" /> );

			await userEvent.click( screen.getByRole( 'link', { name: button } ) );

			expect( recordEvent.mock.calls ).toEqual( [
				[ 'jetpack_protect_dashboard_scan_upsell_view', { variant: shown, exposure: 1 } ],
				[ 'jetpack_protect_dashboard_scan_upsell_click', { variant: shown, exposure: 1 } ],
			] );
		}
	);
} );
