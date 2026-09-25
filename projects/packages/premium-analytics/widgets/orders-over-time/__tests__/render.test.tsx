/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import OrdersOverTimeRender from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	OrderMetricWidget: ( {
		seriesCountLabel,
	}: {
		seriesCountLabel?: ( count: number ) => string;
	} ) => (
		<div
			data-testid="metric-widget"
			data-count-labels={ `${ seriesCountLabel?.( 1 ) }|${ seriesCountLabel?.( 2 ) }` }
		/>
	),
} ) );

describe( 'OrdersOverTimeRender', () => {
	it( 'pluralizes the tooltip unit', () => {
		render( <OrdersOverTimeRender attributes={ {} } /> );

		expect( screen.getByTestId( 'metric-widget' ) ).toHaveAttribute(
			'data-count-labels',
			'%s Order|%s Orders'
		);
	} );
} );
