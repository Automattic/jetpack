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
	beforeAll( () => {
		window.jetpackProtectTracks = true;
	} );
	afterAll( () => {
		delete window.jetpackProtectTracks;
	} );

	it.each( [
		[ 3, 3 ],
		[ 99, 1 ],
	] )( 'tags the view and the click with the copy shown (variant %d)', async ( given, shown ) => {
		recordEvent.mockClear();
		window.localStorage.clear();
		render( <ScanUpsell variant={ given } url="#buy" /> );

		await userEvent.click( screen.getByRole( 'link', { name: 'Upgrade' } ) );

		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_protect_dashboard_scan_upsell_view', { variant: shown, exposure: 1 } ],
			[ 'jetpack_protect_dashboard_scan_upsell_click', { variant: shown, exposure: 1 } ],
		] );
	} );
} );
