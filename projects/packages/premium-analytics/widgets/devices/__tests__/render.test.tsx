/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import DevicesRender from '../render';
import useDeviceViews from '../use-device-views';
import useDeviceViewsOverTime from '../use-device-views-over-time';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );
jest.mock( '../use-device-views' );
jest.mock( '../use-device-views-over-time' );
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	Donut: () => null,
	ComparativeBarChart: () => null,
} ) );

const mockUseDeviceViews = jest.mocked( useDeviceViews );
const mockUseDeviceViewsOverTime = jest.mocked( useDeviceViewsOverTime );
const reportParams = { from: '2026-06-01', to: '2026-06-30' } as ReportParams;
const state = { isLoading: false, isFetching: false, isError: false, refetch: jest.fn() };

beforeEach( () => {
	jest.clearAllMocks();
	mockUseDeviceViews.mockReturnValue( {
		...state,
		data: [ { label: 'desktop', displayLabel: 'Desktop', percentage: 100 } ],
		hasComparison: false,
		error: null,
	} );
	mockUseDeviceViewsOverTime.mockReturnValue( {
		...state,
		devices: [ { key: 'desktop', label: 'Desktop', value: 10, current: [] } ],
	} );
} );

describe( 'DevicesWidget', () => {
	// Saved dashboards have no chart type, and must keep the semi-circle and its request.
	it.each( [
		[ 'the semi-circle without a chart type', {}, true ],
		[ 'the bars for the bar chart type', { chartType: 'bar' as const }, false ],
	] )( 'draws %s', ( _case, attributes, semiCircle ) => {
		render( <DevicesRender attributes={ { ...attributes, reportParams } } /> );

		expect( mockUseDeviceViews.mock.calls.length > 0 ).toBe( semiCircle );
		expect( mockUseDeviceViewsOverTime.mock.calls.length > 0 ).toBe( ! semiCircle );
	} );
} );
