import { act, render, screen } from '@testing-library/react';
import { DateFiltersPanel } from '../date-filters-panel';
import type { ComponentProps } from 'react';

// The width the mocked measuring rig reports for the full-labels row.
const mockFullRowWidth = 600;

jest.mock( '../preset-row-probe', () => ( {
	PresetRowProbe: ( { onMeasure }: { onMeasure: ( width: number ) => void } ) => {
		const { useEffect } = jest.requireActual( 'react' );
		useEffect( () => onMeasure( mockFullRowWidth ), [ onMeasure ] );
		return null;
	},
} ) );

/**
 * Replace the global no-op ResizeObserver stub with one that hands back its
 * callbacks, so a test can report a width the way the browser would, and
 * records what it was told to stop observing.
 *
 * @return `resizeTo`, which reports a width to every live observer, and the
 *         list of unobserved elements.
 */
function mockContainerResize() {
	const callbacks: ResizeObserverCallback[] = [];
	const unobserved: Element[] = [];

	globalThis.ResizeObserver = class {
		constructor( callback: ResizeObserverCallback ) {
			callbacks.push( callback );
		}
		observe() {}
		unobserve( element: Element ) {
			unobserved.push( element );
		}
		disconnect() {}
	} as unknown as typeof ResizeObserver;

	const resizeTo = ( width: number ) =>
		act( () => {
			callbacks.forEach( callback =>
				callback( [ { contentRect: { width } } as ResizeObserverEntry ], {} as ResizeObserver )
			);
		} );

	return { resizeTo, unobserved };
}

function renderPanel( props: Partial< ComponentProps< typeof DateFiltersPanel > > = {} ) {
	return render(
		<DateFiltersPanel
			presetId="last-30-days"
			range={ {
				from: new Date( '2026-07-01T00:00:00.000Z' ),
				to: new Date( '2026-07-30T23:59:59.999Z' ),
			} }
			onChange={ jest.fn() }
			onComparisonChange={ jest.fn() }
			onApply={ jest.fn() }
			onCancel={ jest.fn() }
			timeZone="UTC"
			{ ...props }
		/>
	);
}

describe( 'DateFiltersPanel', () => {
	it( 'publishes the full-labels row width on its root', () => {
		mockContainerResize();
		const { container } = renderPanel();

		// The contract under test is inline style on the component's root box,
		// which has no user-facing semantics to query.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const root = container.querySelector( '.date-filters-panel' ) as HTMLElement;
		expect( root.style.getPropertyValue( '--date-filters-panel-full-row-width' ) ).toBe(
			`${ mockFullRowWidth }px`
		);
	} );

	it( 'abbreviates the presets when the measured width is under the full row', () => {
		const { resizeTo } = mockContainerResize();
		renderPanel();

		expect( screen.getByText( 'Last 30 days' ) ).toBeInTheDocument();

		resizeTo( mockFullRowWidth - 100 );

		expect( screen.getByText( '30D' ) ).toBeInTheDocument();
	} );

	it( 'recovers the full labels when the width comes back', () => {
		const { resizeTo } = mockContainerResize();
		renderPanel();

		resizeTo( mockFullRowWidth - 100 );
		resizeTo( mockFullRowWidth + 100 );

		expect( screen.queryByText( '30D' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Last 30 days' ) ).toBeInTheDocument();
	} );

	it( 'subtracts the reserved share from an external measure', () => {
		const { resizeTo } = mockContainerResize();
		renderPanel( { containerElement: document.body, reservedInlineSize: 200 } );

		resizeTo( mockFullRowWidth + 100 );

		expect( screen.getByText( '30D' ) ).toBeInTheDocument();
	} );

	it( 'stops observing on unmount', () => {
		const { unobserved } = mockContainerResize();
		const external = document.createElement( 'div' );
		const { unmount } = renderPanel( { containerElement: external } );

		unmount();

		expect( unobserved ).toContain( external );
	} );
} );
