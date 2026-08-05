/**
 * External dependencies
 */
import { StatsTotalMetricWidget } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import TotalVisitorsRender from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	StatsTotalMetricWidget: jest.fn( () => <div data-testid="total-metric" /> ),
} ) );

const mockStatsTotalMetricWidget = jest.mocked( StatsTotalMetricWidget );

describe( 'TotalVisitorsWidget', () => {
	beforeEach( () => {
		mockStatsTotalMetricWidget.mockClear();
	} );

	it( 'renders the shared card for the visitors field', () => {
		render( <TotalVisitorsRender attributes={ {} } /> );

		expect( screen.getByTestId( 'total-metric' ) ).toBeInTheDocument();
		expect( mockStatsTotalMetricWidget.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			field: 'visitors',
		} );
	} );
} );
