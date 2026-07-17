/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import UtmInsightsWidget from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-utm-insights', () => ( {
	__esModule: true,
	default: () => ( {
		data: [],
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		hasData: false,
		isError: false,
	} ),
} ) );

describe( 'UtmInsightsWidget', () => {
	it( 'links to the UTM report', () => {
		render( <UtmInsightsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/utm' )
		);
		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=source-medium' )
		);
	} );

	it( 'links the combined campaign dimension to its matching report tab', () => {
		render(
			<UtmInsightsWidget attributes={ { utmDimension: 'utm_campaign,utm_source,utm_medium' } } />
		);

		expect( screen.getByRole( 'link', { name: 'See report' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'section=campaign-source-medium' )
		);
	} );
} );
