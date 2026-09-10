import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	DetailPageActions,
	DetailPageBreadcrumbs,
	useDetailPageCustomize,
} from '../detail-page-customize';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const layout = [ { uuid: 'card', type: 'jpa/card' } ] as DashboardWidget[];

const editingActions = <div data-testid="dashboard-actions" />;

describe( 'useDetailPageCustomize', () => {
	it( 'lets the reader rearrange cards but never add or remove them', () => {
		const { result } = renderHook( () => useDetailPageCustomize( layout ) );
		const { canPerform } = result.current;
		const widget = layout[ 0 ];
		const widgetType = { name: 'jpa/card' } as never;

		expect( canPerform( { operation: 'move', widget } ) ).toBe( true );
		expect( canPerform( { operation: 'resize', widget } ) ).toBe( true );
		expect( canPerform( { operation: 'edit', widget } ) ).toBe( true );
		expect( canPerform( { operation: 'insert', widgetType } ) ).toBe( false );
		expect( canPerform( { operation: 'remove', widget } ) ).toBe( false );
		// The page options menu is the way in, not the dashboard's own button.
		expect( canPerform( { operation: 'customize' } ) ).toBe( false );
		expect( result.current.canCustomize ).toBe( true );
	} );

	it( 'offers Reset only while customizing', () => {
		const { result } = renderHook( () => useDetailPageCustomize( layout ) );

		expect( result.current.canPerform( { operation: 'reset' } ) ).toBe( false );

		act( () => result.current.startCustomizing() );

		expect( result.current.isCustomizing ).toBe( true );
		expect( result.current.canPerform( { operation: 'reset' } ) ).toBe( true );

		act( () => result.current.onEditChange( false ) );

		expect( result.current.isCustomizing ).toBe( false );
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
	it( 'keeps Customize first in the page options menu beside the page actions', async () => {
		const user = userEvent.setup();
		const onCustomize = jest.fn();
		render(
			<DetailPageActions
				isCustomizing={ false }
				onCustomize={ onCustomize }
				editingActions={ editingActions }
			>
				<a href="https://example.com/">View post</a>
			</DetailPageActions>
		);

		expect( screen.getByRole( 'link', { name: 'View post' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		const items = await screen.findAllByRole( 'menuitem' );
		expect( items.map( item => item.textContent ) ).toEqual( [ 'Customize', 'Any feedback?' ] );

		await user.click( items[ 0 ] );

		expect( onCustomize ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves Customize out where there is nothing to arrange', async () => {
		const user = userEvent.setup();
		render( <DetailPageActions isCustomizing={ false } editingActions={ editingActions } /> );

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Customize' } ) ).not.toBeInTheDocument();
	} );

	it( "keeps the menu, less Customize, while the dashboard's own actions take the slot", async () => {
		const user = userEvent.setup();
		render(
			<DetailPageActions isCustomizing onCustomize={ () => {} } editingActions={ editingActions }>
				<a href="https://example.com/">View post</a>
			</DetailPageActions>
		);

		expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );

		await expect(
			screen.findByRole( 'menuitem', { name: 'Any feedback?' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'menuitem', { name: 'Customize' } ) ).not.toBeInTheDocument();
	} );

	it( 'moves focus back onto the menu trigger when leaving unmounts the focused control', async () => {
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

		await user.click( screen.getByRole( 'button', { name: 'Page options' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );
		rerender(
			<DetailPageActions
				isCustomizing
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);
		// The trigger outlives the swap, and the menu closes onto it.
		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Page options' } ) ).toHaveFocus()
		);

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		rerender(
			<DetailPageActions
				isCustomizing={ false }
				onCustomize={ () => {} }
				editingActions={ dashboardActions }
			/>
		);
		expect( screen.getByRole( 'button', { name: 'Page options' } ) ).toHaveFocus();
	} );
} );
