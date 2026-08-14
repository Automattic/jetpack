/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import TopPlatformsWidget from '../render';
import widgetDefinition from '../widget';

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockUsePlatformViews = jest.fn();

// Only the hook itself is stubbed; `isPlatformDimension` stays real so the
// guard below exercises the shipped implementation.
jest.mock( '../use-platform-views', () => ( {
	...jest.requireActual( '../use-platform-views' ),
	__esModule: true,
	default: ( ...args: unknown[] ) => mockUsePlatformViews( ...( args as [] ) ),
} ) );

function stateWith( rows: { key: string; label: string; views: number }[] ) {
	return {
		data: rows,
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: () => {},
	};
}

describe( 'TopPlatformsWidget', () => {
	beforeEach( () => {
		mockUsePlatformViews.mockReset();
		mockUsePlatformViews.mockReturnValue( stateWith( [] ) );
	} );

	it.each( [ 'screensize', 'browser', 'platform' ] as const )(
		'requests the %s device property',
		platformDimension => {
			render( <TopPlatformsWidget attributes={ { platformDimension } } /> );

			expect( mockUsePlatformViews ).toHaveBeenLastCalledWith(
				expect.objectContaining( { deviceProperty: platformDimension } )
			);
		}
	);

	// `SelectField` renders the first element when the attribute is unset, so the
	// control would otherwise name a dimension the widget is not fetching.
	it( 'defaults to the first offered dimension', () => {
		const firstElement = widgetDefinition.attributes.find(
			field => field.id === 'platformDimension'
		)?.elements?.[ 0 ];

		render( <TopPlatformsWidget attributes={ {} } /> );

		expect( mockUsePlatformViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { deviceProperty: firstElement?.value } )
		);
	} );

	// A stale layout can name a dimension the widget no longer knows; unchecked it
	// becomes the endpoint path segment, which WPCOM rejects with a 400.
	it( 'falls back to Browser for a dimension outside the supported set', () => {
		render(
			<TopPlatformsWidget
				attributes={
					{ platformDimension: 'client_type' } as unknown as { platformDimension: 'browser' }
				}
			/>
		);

		expect( mockUsePlatformViews ).toHaveBeenLastCalledWith(
			expect.objectContaining( { deviceProperty: 'browser' } )
		);
	} );

	// WPCOM returns `screensize` as percentage shares and the other two as view
	// counts, so the same leaderboard has to print two different units.
	it( 'prints Size rows as percentages', () => {
		mockUsePlatformViews.mockReturnValue(
			stateWith( [ { key: 'desktop', label: 'Desktop', views: 57.8 } ] )
		);

		render( <TopPlatformsWidget attributes={ { platformDimension: 'screensize' } } /> );

		expect( screen.getByText( '57.8%' ) ).toBeInTheDocument();
	} );

	it( 'prints Browser rows as counts', () => {
		mockUsePlatformViews.mockReturnValue(
			stateWith( [ { key: 'chrome', label: 'Chrome', views: 812 } ] )
		);

		render( <TopPlatformsWidget attributes={ { platformDimension: 'browser' } } /> );

		expect( screen.getByText( '812' ) ).toBeInTheDocument();
	} );
} );
