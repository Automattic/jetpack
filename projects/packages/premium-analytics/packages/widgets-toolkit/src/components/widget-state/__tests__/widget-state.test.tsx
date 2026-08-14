/**
 * External dependencies
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { chartBar } from '@wordpress/icons';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { errorStateIcon } from '../error-state-icon';
import { WidgetState } from '../widget-state';
import type { ReactElement } from 'react';

// The shared CSS Module stub resolves every stylesheet to `{}`, so class names
// never reach the DOM. Name the two this file asserts on, rather than swapping
// the stub package-wide for one test: that would put class names on every
// component in every suite.
jest.mock( '../widget-state.module.scss', () => ( {
	content: 'content',
	contentHidden: 'contentHidden',
} ) );

const CONTENT = <div>rows</div>;

function Counter() {
	const [ count, setCount ] = useState( 0 );
	return (
		<button type="button" onClick={ () => setCount( count + 1 ) }>
			{ count }
		</button>
	);
}

/**
 * Read the `d` attribute of the first SVG path inside a container, so icon
 * identity can be compared without hardcoding brittle path strings.
 *
 * @param container - A rendered element's container node.
 * @return The path data, or null if no SVG path is present.
 */
function svgPathOf( container: HTMLElement ): string | null {
	return container.querySelector( 'svg path' )?.getAttribute( 'd' ) ?? null;
}

/**
 * Mount an element in isolation and return its first SVG path data.
 *
 * @param element - The React element to mount.
 * @return The path data, or null if no SVG path is present.
 */
function iconPathOf( element: ReactElement ): string | null {
	const { container, unmount } = render( element );
	const path = svgPathOf( container );
	unmount();
	return path;
}

function elapseFetchDelay() {
	act( () => {
		jest.advanceTimersByTime( 1000 );
	} );
}

describe( 'WidgetState', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'renders children when ready, with no skeleton', () => {
		render(
			<WidgetState isLoading={ false } isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the loading state on first load even when empty', () => {
		render(
			<WidgetState isLoading isError={ false } isEmpty>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.queryByText( 'rows' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
	} );

	it( 'renders the loading state whenever isLoading, regardless of the caller-derived isEmpty', () => {
		// `isEmpty` is derived by the caller and can be false during first load
		// (e.g. `data?.rows.length === 0` while data is still undefined); loading
		// must still block rendering children against absent data.
		render(
			<WidgetState isLoading isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.queryByText( 'rows' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
	} );

	it( 'shows loading, not the empty state, once a refetch over an empty result drags on', () => {
		render(
			<WidgetState
				isLoading={ false }
				isFetching
				isError={ false }
				isEmpty
				empty={ { description: 'No posts here.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'No posts here.' ) ).toBeInTheDocument();

		elapseFetchDelay();
		expect( screen.queryByText( 'No posts here.' ) ).not.toBeInTheDocument();
		// Silent, like the ready branch's overlay: this is still a refetch, and
		// only a first load announces. Otherwise whether a widget speaks up would
		// depend on what it happened to be showing beforehand.
		expect( screen.getByRole( 'status', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the caller loading override instead of the default skeleton', () => {
		render(
			<WidgetState isLoading isError={ false } isEmpty renderLoading={ <div>override</div> }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'override' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'uses the caller loading override during a refetch too, not just the first load', () => {
		render(
			<WidgetState
				isLoading={ false }
				isFetching
				isError={ false }
				isEmpty={ false }
				renderLoading={ <div>override</div> }
			>
				{ CONTENT }
			</WidgetState>
		);
		elapseFetchDelay();
		expect( screen.getByText( 'override' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the empty state (not error) when resolved with no rows', () => {
		render(
			<WidgetState
				isLoading={ false }
				isError={ false }
				isEmpty
				empty={ { description: 'No posts here.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'No posts here.' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'rows' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the error state with an action button', () => {
		const onClick = jest.fn();
		render(
			<WidgetState
				isLoading={ false }
				isError
				isEmpty={ false }
				error={ { description: 'Failed.', actions: [ { label: 'Retry', onClick } ] } }
			>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'Failed.' ) ).toBeInTheDocument();
		// The error state is announced to assistive tech via role="alert".
		expect( screen.getByRole( 'alert' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders no empty icon by default, but honors a caller icon distinct from the error icon', () => {
		const providedGlyphPath = iconPathOf( <>{ chartBar }</> );
		const errorGlyphPath = iconPathOf( errorStateIcon );
		// Sanity: the sample and error source glyphs really are different.
		expect( providedGlyphPath ).not.toBe( errorGlyphPath );

		// Default empty state carries no icon — no domain-specific default glyph.
		const { container: bareEmpty, unmount: unmountBare } = render(
			<WidgetState
				isLoading={ false }
				isError={ false }
				isEmpty
				empty={ { description: 'No posts here.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		expect( svgPathOf( bareEmpty ) ).toBeNull();
		unmountBare();

		// A caller-provided icon renders and stays distinct from the error glyph.
		const { container: emptyContainer, unmount: unmountEmpty } = render(
			<WidgetState
				isLoading={ false }
				isError={ false }
				isEmpty
				empty={ { icon: chartBar, description: 'No posts here.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		const emptyIcon = svgPathOf( emptyContainer );
		expect( emptyIcon ).toBe( providedGlyphPath );
		expect( emptyIcon ).not.toBe( errorGlyphPath );
		unmountEmpty();

		const { container: errorContainer } = render(
			<WidgetState
				isLoading={ false }
				isError
				isEmpty={ false }
				error={ { description: 'Failed.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		expect( svgPathOf( errorContainer ) ).toBe( errorGlyphPath );
	} );

	it( 'leaves a refetch that resolves quickly alone, drawing no skeleton at all', () => {
		render(
			<WidgetState isLoading={ false } isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
	} );

	it( 'covers the children with a silent skeleton once a refetch drags on, marking the region busy', () => {
		render(
			<WidgetState isLoading={ false } isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		elapseFetchDelay();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'status', { hidden: true } ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'generic', { busy: true } ) ).toHaveLength( 1 );
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
	} );

	it( 'keeps the children mounted across a refetch, so their own state survives it', () => {
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { container, rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				<Counter />
			</WidgetState>
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the CSS Module class is the behavior under test.
		const content = container.querySelector( '.content' );
		expect( content ).not.toHaveClass( 'contentHidden' );
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button' ) );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( '1' );

		rerender(
			<WidgetState { ...props } isFetching>
				<Counter />
			</WidgetState>
		);
		elapseFetchDelay();
		expect( content ).toHaveClass( 'contentHidden' );
		rerender(
			<WidgetState { ...props } isFetching={ false }>
				<Counter />
			</WidgetState>
		);
		expect( content ).not.toHaveClass( 'contentHidden' );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( '1' );
	} );

	it( 'holds focus in the widget body for the length of the refetch', () => {
		// Not just on the way out: the browser drops focus to the body as soon as
		// the children are hidden, and the skeleton window is 400ms at best.
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				<button type="button">Taiwan</button>
			</WidgetState>
		);
		const row = screen.getByRole( 'button', { name: 'Taiwan' } );
		act( () => row.focus() );

		rerender(
			<WidgetState { ...props } isFetching>
				<button type="button">Taiwan</button>
			</WidgetState>
		);
		elapseFetchDelay();

		// Parked on the wrapper: not the hidden row, and not the document body,
		// where the next Tab would jump to the top of the page.
		expect( row ).not.toHaveFocus();
		expect( document.body ).not.toHaveFocus();
		// eslint-disable-next-line @wordpress/no-global-active-element, testing-library/no-node-access -- which element the browser focused is the assertion, and the wrapper is deliberately not queryable.
		expect( document.activeElement ).toContainElement( row );
	} );

	it( 'returns focus to the element a refetch took it from', () => {
		// Keyboard-activating a drill-down row refetches by definition, so this is
		// the common path, not an edge case.
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				<button type="button">Taiwan</button>
			</WidgetState>
		);
		const row = screen.getByRole( 'button', { name: 'Taiwan' } );
		act( () => row.focus() );

		rerender(
			<WidgetState { ...props } isFetching>
				<button type="button">Taiwan</button>
			</WidgetState>
		);
		elapseFetchDelay();

		rerender(
			<WidgetState { ...props } isFetching={ false }>
				<button type="button">Taiwan</button>
			</WidgetState>
		);
		expect( row ).toHaveFocus();
	} );

	it( 'parks focus in the widget body when the refetch replaced that element', () => {
		// The drill-down case: the row that was activated is not in the new data.
		// Keyed, so React unmounts it rather than reusing the node for the new row
		// — reuse would keep the original target connected and miss this path.
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				<button type="button" key="tw">
					Taiwan
				</button>
			</WidgetState>
		);
		act( () => screen.getByRole( 'button', { name: 'Taiwan' } ).focus() );

		rerender(
			<WidgetState { ...props } isFetching>
				<button type="button" key="tw">
					Taiwan
				</button>
			</WidgetState>
		);
		elapseFetchDelay();

		rerender(
			<WidgetState { ...props } isFetching={ false }>
				<button type="button" key="tp">
					Taipei
				</button>
			</WidgetState>
		);
		// Focus sits on the body wrapper, so the next Tab continues from the widget
		// rather than the top of the document.
		expect( document.body ).not.toHaveFocus();
		// eslint-disable-next-line @wordpress/no-global-active-element, testing-library/no-node-access -- which element the browser focused is the assertion, and the body wrapper is deliberately not queryable.
		expect( document.activeElement ).toContainElement(
			screen.getByRole( 'button', { name: 'Taipei' } )
		);
	} );

	it( 'leaves focus alone when the reader moved on during the refetch', () => {
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { rerender } = render(
			<>
				<button type="button">Elsewhere</button>
				<WidgetState { ...props } isFetching={ false }>
					<button type="button">Taiwan</button>
				</WidgetState>
			</>
		);
		act( () => screen.getByRole( 'button', { name: 'Taiwan' } ).focus() );

		rerender(
			<>
				<button type="button">Elsewhere</button>
				<WidgetState { ...props } isFetching>
					<button type="button">Taiwan</button>
				</WidgetState>
			</>
		);
		elapseFetchDelay();
		const elsewhere = screen.getByRole( 'button', { name: 'Elsewhere' } );
		act( () => elsewhere.focus() );

		rerender(
			<>
				<button type="button">Elsewhere</button>
				<WidgetState { ...props } isFetching={ false }>
					<button type="button">Taiwan</button>
				</WidgetState>
			</>
		);
		expect( elsewhere ).toHaveFocus();
	} );

	it( 'error wins over loading and empty (retry in flight after a failed fetch)', () => {
		// The production shape on a failed fetch: isError with isEmpty derived
		// true, plus loading signals while a retry is in flight. The priority
		// contract (error → loading → empty → ready) must hold.
		render(
			<WidgetState isLoading isFetching isError isEmpty error={ { description: 'Failed.' } }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'Failed.' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'rows' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
	} );
} );
