import analytics from '@automattic/jetpack-analytics';
import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { act, render, renderHook, screen } from '@testing-library/react';
import { DetailPageBreadcrumbs, useDetailPageCustomize } from '../detail-page-customize';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const layout = [ { uuid: 'card', type: 'jpa/card' } ] as DashboardWidget[];

describe( 'detail-page-customize', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
		jest.mocked( currentUserCan ).mockReturnValue( false );
	} );

	describe( 'useDetailPageCustomize', () => {
		it.each( [
			[ 'move', true ],
			[ 'resize', true ],
			[ 'edit', true ],
			[ 'insert', false ],
			[ 'remove', false ],
			[ 'customize', false ],
			[ 'reset', false ],
		] )(
			'lets the reader rearrange cards but never add or remove them: %s is %s',
			( operation, allowed ) => {
				const { result } = renderHook( () => useDetailPageCustomize( layout ) );

				expect(
					result.current.canPerform( {
						operation,
						widget: layout[ 0 ],
						widgetType: { name: 'jpa/card' },
					} as never )
				).toBe( allowed );
			}
		);

		it( 'resets the stored layout and leaves customize mode on Reset to default', () => {
			const onLayoutReset = jest.fn();
			const { result } = renderHook( () => useDetailPageCustomize( layout, { onLayoutReset } ) );

			act( () => result.current.startCustomizing() );
			act( () => result.current.resetToDefault() );

			expect( onLayoutReset ).toHaveBeenCalledTimes( 1 );
			expect( result.current.isCustomizing ).toBe( false );
		} );

		it( 'stores the committed layout and tracks the customize session', () => {
			const onLayoutChange = jest.fn();
			const onLayoutReset = jest.fn();
			const moved = [ { ...layout[ 0 ], attributes: { view: 'list' } } ] as DashboardWidget[];
			const { result } = renderHook( () =>
				useDetailPageCustomize( layout, { onLayoutChange, onLayoutReset, surface: 'post_detail' } )
			);

			act( () => result.current.startCustomizing() );
			// Done: the dashboard commits, then leaves edit mode, in one call.
			act( () => {
				result.current.onLayoutChange( moved );
				result.current.onEditChange( false );
			} );
			expect( result.current.isCustomizing ).toBe( false );
			act( () => result.current.startCustomizing() );
			act( () => result.current.resetToDefault() );

			expect( onLayoutChange ).toHaveBeenCalledWith( moved );
			expect( recordEvent.mock.calls.map( ( [ name ] ) => name ) ).toEqual( [
				'jetpack_premium_analytics_customize_start',
				'jetpack_premium_analytics_customize_save',
				'jetpack_premium_analytics_customize_exit',
				'jetpack_premium_analytics_customize_start',
				'jetpack_premium_analytics_customize_reset',
			] );
			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_customize_exit', {
				surface: 'post_detail',
				saved: true,
			} );
		} );

		it( 'will not open on an empty layout, from the menu or the dashboard', () => {
			const { result } = renderHook( () => useDetailPageCustomize( [] ) );

			expect( result.current.canCustomize ).toBe( false );
			act( () => result.current.startCustomizing() );
			act( () => result.current.onEditChange( true ) );

			expect( result.current.isCustomizing ).toBe( false );
		} );

		it( 'leaves customize mode when the layout on show changes', () => {
			const { result, rerender } = renderHook(
				( { layoutId }: { layoutId: string } ) => useDetailPageCustomize( layout, { layoutId } ),
				{ initialProps: { layoutId: 'traffic' } }
			);

			act( () => result.current.startCustomizing() );
			expect( result.current.isCustomizing ).toBe( true );

			rerender( { layoutId: 'email-opens' } );

			expect( result.current.isCustomizing ).toBe( false );
		} );

		it( 'leaves customize mode once there is nothing left to customize', () => {
			const { result, rerender } = renderHook(
				( { enabled }: { enabled: boolean } ) => useDetailPageCustomize( layout, { enabled } ),
				{ initialProps: { enabled: true } }
			);

			act( () => result.current.startCustomizing() );
			expect( result.current.isCustomizing ).toBe( true );

			rerender( { enabled: false } );

			expect( result.current.isCustomizing ).toBe( false );
			expect( result.current.canCustomize ).toBe( false );
			act( () => result.current.startCustomizing() );
			expect( result.current.isCustomizing ).toBe( false );
		} );
	} );

	describe( 'DetailPageBreadcrumbs', () => {
		it( 'adds the Customizing badge only while customizing', () => {
			const { rerender } = render(
				<DetailPageBreadcrumbs isCustomizing={ false }>
					<nav>Trail</nav>
				</DetailPageBreadcrumbs>
			);

			expect( screen.getByText( 'Trail' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Customizing' ) ).not.toBeInTheDocument();

			rerender(
				<DetailPageBreadcrumbs isCustomizing>
					<nav>Trail</nav>
				</DetailPageBreadcrumbs>
			);

			expect( screen.getByText( 'Customizing' ) ).toBeInTheDocument();
		} );
	} );
} );
