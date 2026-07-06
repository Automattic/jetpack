/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { cautionFilled, chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { WidgetState } from '../widget-state';
import type { ReactElement } from 'react';

const CONTENT = <div>rows</div>;

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
	it( 'renders children when ready', () => {
		render(
			<WidgetState isLoading={ false } isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
	} );

	it( 'renders the loading state on first load even when empty', () => {
		render(
			<WidgetState isLoading isError={ false } isEmpty>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.queryByText( 'rows' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'presentation', { hidden: true } ) ).toBeInTheDocument(); // spinner wrapper
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
		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'uses a neutral empty icon, distinct from the error caution icon', () => {
		const neutralPath = iconPathOf( <>{ chartBar }</> );
		const cautionPath = iconPathOf( <>{ cautionFilled }</> );
		// Sanity: the two source glyphs really are different.
		expect( neutralPath ).not.toBe( cautionPath );

		const { container: emptyContainer, unmount: unmountEmpty } = render(
			<WidgetState
				isLoading={ false }
				isError={ false }
				isEmpty
				empty={ { description: 'No posts here.' } }
			>
				{ CONTENT }
			</WidgetState>
		);
		const emptyIcon = svgPathOf( emptyContainer );
		expect( emptyIcon ).toBe( neutralPath );
		expect( emptyIcon ).not.toBe( cautionPath );
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
		expect( svgPathOf( errorContainer ) ).toBe( cautionPath );
	} );

	it( 'keeps children visible during a background refetch (busy)', () => {
		render(
			<WidgetState isLoading={ false } isFetching isError={ false } isEmpty={ false }>
				{ CONTENT }
			</WidgetState>
		);
		expect( screen.getByText( 'rows' ) ).toBeInTheDocument();
	} );
} );
