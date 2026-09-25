/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import VisitorsOverTimeRender from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	ReportMetricWidget: ( {
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

describe( 'VisitorsOverTimeRender', () => {
	it( 'pluralizes the tooltip unit', () => {
		render( <VisitorsOverTimeRender attributes={ {} } /> );

		expect( screen.getByTestId( 'metric-widget' ) ).toHaveAttribute(
			'data-count-labels',
			'%s Visitor|%s Visitors'
		);
	} );
} );
