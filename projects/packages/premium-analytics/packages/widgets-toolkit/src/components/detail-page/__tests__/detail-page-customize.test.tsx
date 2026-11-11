import analytics from '@automattic/jetpack-analytics';
import { currentUserCan, getScriptData } from '@automattic/jetpack-script-data';
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	useDetailPageCustomize,
} from '../detail-page-customize';
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

const editingActions = <div data-testid="dashboard-actions" />;

describe( 'detail-page-customize', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( getScriptData ).mockReturnValue( {} as ReturnType< typeof getScriptData > );
		jest.mocked( currentUserCan ).mockReturnValue( false );
	} );

	describe( 'useDetailPageCustomize', () => {
		// Customize enters through the page options menu, and Reset to default is ours too.
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

	describe( 'DetailPageActions', () => {
		it( 'offers Customize as a button outside the menu', async () => {
			const user = userEvent.setup();
			const onCustomize = jest.fn();
			render(
				<DetailPageActions
					isCustomizing={ false }
					onCustomize={ onCustomize }
					onReset={ () => {} }
					editingActions={ editingActions }
				>
					<a href="https://example.com/">View post</a>
				</DetailPageActions>
			);

			expect( screen.getByRole( 'link', { name: 'View post' } ) ).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Reset to default' } )
			).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
			const items = await screen.findAllByRole( 'menuitem' );
			expect( items.map( item => item.textContent ) ).toEqual( [ 'Any feedback?' ] );
			await user.keyboard( '{Escape}' );

			await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );

			expect( onCustomize ).toHaveBeenCalledTimes( 1 );
		} );

		it( "swaps Customize for Reset to default beside the dashboard's own actions, keeping the menu", () => {
			render(
				<DetailPageActions
					isCustomizing
					onCustomize={ () => {} }
					onReset={ () => {} }
					editingActions={ editingActions }
				>
					<a href="https://example.com/">View post</a>
				</DetailPageActions>
			);

			expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: 'Customize' } ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Reset to default' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Page options' } ) ).toBeInTheDocument();
		} );

		it.each( [
			[ 'Customize', () => {} ],
			[ 'Page options', undefined ],
		] )(
			'moves focus onto %s when leaving unmounts the focused control',
			async ( target, onCustomize ) => {
				const user = userEvent.setup();
				const dashboardActions = (
					<>
						<button>Cancel</button>
						<button disabled>Done</button>
					</>
				);
				const { rerender } = render(
					<DetailPageActions
						isCustomizing
						onCustomize={ onCustomize }
						editingActions={ dashboardActions }
					/>
				);

				await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
				rerender(
					<DetailPageActions
						isCustomizing={ false }
						onCustomize={ onCustomize }
						editingActions={ dashboardActions }
					/>
				);
				expect( screen.getByRole( 'button', { name: target } ) ).toHaveFocus();
			}
		);

		it( 'leaves focus alone at load and when customize mode starts on its own, as an empty layout does', () => {
			const dashboardActions = <button>Cancel</button>;
			const { rerender } = render(
				<DetailPageActions
					isCustomizing={ false }
					onCustomize={ () => {} }
					editingActions={ dashboardActions }
				/>
			);
			expect( document.body ).toHaveFocus();

			rerender(
				<DetailPageActions
					isCustomizing
					onCustomize={ () => {} }
					editingActions={ dashboardActions }
				/>
			);

			expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).not.toHaveFocus();
		} );

		it( 'leaves focus alone when customize mode ends while focus is elsewhere, as on a tab switch', () => {
			const dashboardActions = <button>Cancel</button>;
			const page = ( isCustomizing: boolean ) => (
				<>
					<button>Tab</button>
					<DetailPageActions
						isCustomizing={ isCustomizing }
						onCustomize={ () => {} }
						editingActions={ dashboardActions }
					/>
				</>
			);
			const { rerender } = render( page( true ) );
			const tab = screen.getByRole( 'button', { name: 'Tab' } );
			act( () => tab.focus() );

			rerender( page( false ) );

			expect( tab ).toHaveFocus();
		} );

		it( 'moves focus onto the first editing action when entering unmounts Customize', async () => {
			const user = userEvent.setup();
			const dashboardActions = (
				<>
					<button>Cancel</button>
					<button disabled>Done</button>
				</>
			);
			const { rerender } = render(
				<DetailPageActions
					isCustomizing={ false }
					onCustomize={ () => {} }
					editingActions={ dashboardActions }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );
			rerender(
				<DetailPageActions
					isCustomizing
					onCustomize={ () => {} }
					editingActions={ dashboardActions }
				/>
			);
			expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus();
		} );

		it( 'moves focus onto Customize after Reset to default, even once another popup has closed', async () => {
			const user = userEvent.setup();
			function Page() {
				const [ isCustomizing, setIsCustomizing ] = useState( false );
				return (
					<DetailPageActions
						isCustomizing={ isCustomizing }
						onCustomize={ () => setIsCustomizing( true ) }
						onReset={ () => setIsCustomizing( false ) }
						editingActions={ <button>Cancel</button> }
					/>
				);
			}
			render( <Page /> );

			await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
			await expect( screen.findAllByRole( 'menuitem' ) ).resolves.not.toHaveLength( 0 );
			await user.keyboard( '{Escape}' );
			await user.click( screen.getByRole( 'button', { name: 'Customize' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
			await user.click(
				within( await screen.findByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Reset' } )
			);

			await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
			expect( screen.getByRole( 'button', { name: 'Customize' } ) ).toHaveFocus();
		} );
	} );
} );
