import { act, render, renderHook, screen } from '@testing-library/react';
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
	it( 'keeps Customize behind the page options menu beside the page actions', async () => {
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
		await user.click( await screen.findByRole( 'menuitem', { name: 'Customize' } ) );

		expect( onCustomize ).toHaveBeenCalledTimes( 1 );
	} );

	it( "hands the slot to the dashboard's own actions while customizing", () => {
		render(
			<DetailPageActions isCustomizing onCustomize={ () => {} } editingActions={ editingActions }>
				<a href="https://example.com/">View post</a>
			</DetailPageActions>
		);

		expect( screen.getByTestId( 'dashboard-actions' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Page options' } ) ).not.toBeInTheDocument();
	} );

	it( 'moves focus across the swap so keyboard users keep their place', async () => {
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
		expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus();

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
