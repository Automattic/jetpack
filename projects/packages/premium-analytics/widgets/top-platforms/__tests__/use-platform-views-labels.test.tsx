/**
 * External dependencies
 */
import { queryClient, type ReportParams } from '@jetpack-premium-analytics/data';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { queryClientWrapper as wrapper } from '../../test-utils';
import usePlatformViews from '../use-platform-views';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const reportParams = { from: '2026-06-01', to: '2026-06-30' } as ReportParams;

// `stats/devices/{property}` answers with a flat key/value map; the keys are the
// raw API vocabulary each dimension uses.
const RESPONSES: Record< string, Record< string, number > > = {
	screensize: { desktop: 57.8, mobile: 37, tablet: 5.2 },
	browser: { chrome: 812, miui: 190 },
	platform: { mac: 402, android_tablet: 65 },
};

type MockedFetchArgs = { path?: string; url?: string };

beforeEach( () => {
	queryClient.clear();
	mockApiFetch.mockImplementation( ( { path = '', url = '' }: MockedFetchArgs ) => {
		const target = path || url;
		const property = Object.keys( RESPONSES ).find( key => target.includes( `devices/${ key }` ) );

		return Promise.resolve( { top_values: property ? RESPONSES[ property ] : {} } );
	} );
} );

describe( 'usePlatformViews labels', () => {
	// Each dimension has its own vocabulary, so the row label depends on which
	// map the hook picks — the thing that silently breaks if the mapping drifts.
	it.each( [
		[ 'screensize', 'desktop', 'Desktop' ],
		[ 'browser', 'miui', 'Mi Browser' ],
		[ 'platform', 'android_tablet', 'Android Tablet' ],
	] as const )( 'maps the %s key %s to %s', async ( deviceProperty, key, expected ) => {
		const { result } = renderHook(
			() => usePlatformViews( { reportParams, max: 10, deviceProperty } ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.data.length ).toBeGreaterThan( 0 ) );

		expect( result.current.data.find( row => row.key === key )?.label ).toBe( expected );
	} );

	// Keys outside the map are title-cased rather than dropped.
	it( 'falls back to title case for an unmapped key', async () => {
		RESPONSES.browser = { vivaldi: 12 };

		const { result } = renderHook(
			() => usePlatformViews( { reportParams, max: 10, deviceProperty: 'browser' } ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.data.length ).toBeGreaterThan( 0 ) );

		expect( result.current.data[ 0 ].label ).toBe( 'Vivaldi' );

		RESPONSES.browser = { chrome: 812, miui: 190 };
	} );
} );
