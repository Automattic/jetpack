/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { chartBar } from '@wordpress/icons';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { errorStateIcon } from '../error-state-icon';
import { WidgetState } from '../widget-state';
import type { ReactElement } from 'react';

const CONTENT = <div>rows</div>;

/**
 * Skips text inside an `aria-hidden` subtree, so a query answers "presented to
 * the user" rather than "in the document".
 */
const PRESENTED = { ignore: 'script, style, [aria-hidden="true"], [aria-hidden="true"] *' };

/**
 * Stand-in for children that own state (the metric tabs' selection, a table's
 * sort and page): the count only survives if the subtree is never unmounted.
 *
 * @return A button labelled with its own click count.
 */
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

describe( 'WidgetState', () => {
	it( 'renders children when ready, with no spinner', () => {
		render(
			<WidgetState isLoading={ false } isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
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

	it( 'shows loading, not the empty state, while refetching over an empty result', () => {
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
		expect( screen.queryByText( 'No posts here.' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
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
		// The chart widgets rely on this: re-splitting the branch so the override
		// only covered `isLoading` would silently drop them back to the generic
		// shape on every date-range change.
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

	it( 'covers the children with the skeleton during a refetch, hiding them from assistive tech', () => {
		render(
			<WidgetState isLoading={ false } isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		// Still mounted, so the state it owns survives — but presented to nobody.
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'rows', PRESENTED ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the children mounted across a refetch, so their own state survives it', () => {
		// The production shape of a date-range change: the queries carry
		// `placeholderData`, so `isLoading` stays false and only `isFetching`
		// flips. Unmounting the children there resets whatever they own — the
		// selected metric tab, a table's sort and page.
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
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	} );
} );
