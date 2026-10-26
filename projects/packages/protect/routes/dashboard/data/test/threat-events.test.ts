import { renderHook } from '@testing-library/react';
import { createThreatView } from '../../sections/scan/threats-list';
import { recordViewChange, useRecordThreatOpen } from '../threat-events';
import { recordEvent } from '../tracks';
import type { ScanThreat } from '../../sections/scan/types';

jest.mock( '../tracks', () => ( { recordEvent: jest.fn() } ) );

const mockRecordEvent = recordEvent as jest.Mock;
const plugin = { id: 1, extension: { type: 'plugins', slug: 'a', name: 'A', version: '1' } };

describe( 'useRecordThreatOpen', () => {
	beforeEach( () => mockRecordEvent.mockReset() );

	it.each( [
		[ 'a plugin', plugin, [ [ 'jetpack_protect_plugin_threat_open' ] ] ],
		[
			'core',
			{ id: 2, signature: 'Vulnerable.WP.Core' },
			[ [ 'jetpack_protect_core_threat_open' ] ],
		],
		[ 'a file', { id: 3, filename: '/a.php' }, [ [ 'jetpack_protect_file_threat_open' ] ] ],
		[ 'nothing for a threat of no known kind', { id: 4 }, [] ],
	] )( 'records %s once while it stays open', ( _, threat, expected ) => {
		const { rerender } = renderHook( props => useRecordThreatOpen( props ), {
			initialProps: threat as ScanThreat,
		} );
		// A refreshed report hands the inspector a new object for the same threat.
		rerender( { ...threat } as ScanThreat );

		expect( mockRecordEvent.mock.calls ).toEqual( expected );
	} );
} );

describe( 'recordViewChange', () => {
	beforeEach( () => mockRecordEvent.mockReset() );

	const view = createThreatView( 'severity' );

	const viewChange = [ 'jetpack_scan_view_change' ];

	it.each( [
		[
			'a search',
			{},
			{ search: 'wp' },
			[ [ 'jetpack_scan_search', { has_query: true } ], viewChange ],
		],
		[ 'a page', {}, { page: 2 }, [ [ 'jetpack_scan_page_change', { page: 2 } ], viewChange ] ],
		[
			'a page back',
			{ page: 3 },
			{ page: 2 },
			[ [ 'jetpack_scan_page_change', { page: 2 } ], viewChange ],
		],
		[
			'a layout',
			{},
			{ type: 'grid' },
			[ [ 'jetpack_scan_layout_changed', { layout: 'grid' } ], viewChange ],
		],
		[
			'a filter',
			{},
			{ filters: [ { field: 'severity', operator: 'is', value: 5 } ] },
			[ [ 'jetpack_scan_filter_change' ], viewChange ],
		],
		[
			'only the view change for a sort',
			{},
			{ sort: { field: 'date', direction: 'asc' } },
			[ viewChange ],
		],
		[ 'nothing for DataViews’ own move back to the last page', { page: 5 }, { page: 3 }, [] ],
	] )( 'records %s', ( _, before, change, expected ) => {
		const previous = { ...view, ...before } as typeof view;

		recordViewChange( previous, { ...previous, ...change } as typeof view, 3 );

		expect( mockRecordEvent.mock.calls ).toEqual( expected );
	} );
} );
