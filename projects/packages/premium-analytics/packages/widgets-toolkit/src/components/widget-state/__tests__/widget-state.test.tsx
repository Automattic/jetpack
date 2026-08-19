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
		// And nothing above it is busy. `aria-busy` defers descendant changes, so
		// a busy ancestor could hold this status back until the moment the node is
		// unmounted — silencing the one announcement a first load owes.
		expect( screen.queryAllByRole( 'generic', { busy: true } ) ).toHaveLength( 0 );
	} );

	it( 'keeps a slow first load out of a busy region, though it reports as fetching too', () => {
		// React Query raises `isFetching` alongside `isLoading` on the first load,
		// so a load that outlasts the delay must not be mistaken for a refetch and
		// wrapped in the busy region that would defer its own announcement.
		render(
			<WidgetState isLoading isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);

		elapseFetchDelay();
		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.queryAllByRole( 'generic', { busy: true } ) ).toHaveLength( 0 );
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

	it( 'keeps the empty state on screen through a refetch that drags on', () => {
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
		// Still the right answer for these params, so a revalidation has nothing
		// to correct.
		expect( screen.getByText( 'No posts here.' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
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

	it( 'keeps the caller loading override out of a refetch, however long it drags on', () => {
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
		expect( screen.queryByText( 'override' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
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
		// Not busy either. Nothing on screen changed, so telling assistive tech
		// the region is updating would interrupt a reader over an update a
		// sighted one never sees.
		expect( screen.queryAllByRole( 'generic', { busy: true } ) ).toHaveLength( 0 );
	} );

	it( 'marks the region busy once a refetch drags on, without covering the children', () => {
		render(
			<WidgetState isLoading={ false } isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		elapseFetchDelay();
		// A long revalidation changes only `aria-busy` — no skeleton at all,
		// hidden or otherwise.
		expect( screen.queryByRole( 'status', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.getAllByRole( 'generic', { busy: true } ) ).toHaveLength( 1 );
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
	} );

	it( 'never takes the numbers off screen across a whole revalidation cycle', () => {
		// The bug lived in the transition, so pinning `isFetching` to one value
		// cannot catch it. `isLoading` stays false throughout: same params.
		const props = { isLoading: false, isError: false, isEmpty: false };
		const rowsOnScreen = () => !! screen.queryByText( 'rows' );

		const { rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( rowsOnScreen() ).toBe( true );

		rerender(
			<WidgetState { ...props } isFetching>
				{ CONTENT }
			</WidgetState>
		);
		expect( rowsOnScreen() ).toBe( true );

		elapseFetchDelay();
		expect( rowsOnScreen() ).toBe( true );

		rerender(
			<WidgetState { ...props } isFetching={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( rowsOnScreen() ).toBe( true );
		expect( screen.queryAllByRole( 'generic', { busy: true } ) ).toHaveLength( 0 );
	} );

	it( 'leaves the children their own state through a revalidation', () => {
		const props = { isLoading: false, isError: false, isEmpty: false };
		const { rerender } = render(
			<WidgetState { ...props } isFetching={ false }>
				<Counter />
			</WidgetState>
		);
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button' ) );
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( '1' );

		rerender(
			<WidgetState { ...props } isFetching>
				<Counter />
			</WidgetState>
		);
		elapseFetchDelay();
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( '1' );

		rerender(
			<WidgetState { ...props } isFetching={ false }>
				<Counter />
			</WidgetState>
		);
		expect( screen.getByRole( 'button' ) ).toHaveTextContent( '1' );
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
