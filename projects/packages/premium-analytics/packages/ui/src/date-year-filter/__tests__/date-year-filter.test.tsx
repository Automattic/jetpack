import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateYearFilter } from '../date-year-filter';
import type { ComponentProps } from 'react';

// Read in UTC, the zone the filter is rendered with below: the local year would
// disagree with it for a few hours around New Year.
const CURRENT_YEAR = new Date().getUTCFullYear();

// Width jsdom reports for every pill, so the surface asks for a known total.
const PILL_WIDTH = 80;

/**
 * Replace the global no-op ResizeObserver stub with one that hands back its
 * callbacks, so a test can report a container width the way the browser would,
 * and records what it was told to stop observing.
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

function renderFilter( props: Partial< ComponentProps< typeof DateYearFilter > > = {} ) {
	const onSelect = jest.fn();

	const element = ( overrides: Partial< ComponentProps< typeof DateYearFilter > > = {} ) => (
		<DateYearFilter
			timeZone="UTC"
			startYear={ CURRENT_YEAR - 2 }
			{ ...props }
			{ ...overrides }
			onSelect={ onSelect }
		/>
	);

	const { rerender, unmount } = render( element() );

	return {
		onSelect,
		unmount,
		rerender: ( overrides: Partial< ComponentProps< typeof DateYearFilter > > ) =>
			rerender( element( overrides ) ),
	};
}

describe( 'DateYearFilter', () => {
	it( 'renders all time plus one pill per year, newest first', () => {
		renderFilter();

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			'All time',
			String( CURRENT_YEAR ),
			String( CURRENT_YEAR - 1 ),
			String( CURRENT_YEAR - 2 ),
		] );
	} );

	it( 'presses the pill matching the active preset', () => {
		renderFilter( { value: `year-${ CURRENT_YEAR - 1 }` } );

		expect( screen.getByRole( 'button', { name: String( CURRENT_YEAR - 1 ) } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'All time' } ) ).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	} );

	it( 'leaves every pill unpressed for a preset from another surface', () => {
		renderFilter( { value: 'last-7-days' } );

		screen.getAllByRole( 'button' ).forEach( button => {
			expect( button ).toHaveAttribute( 'aria-pressed', 'false' );
		} );
	} );

	it( 'selects a closed year as its full calendar range', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderFilter();
		const year = CURRENT_YEAR - 1;

		await user.click( screen.getByRole( 'button', { name: String( year ) } ) );

		expect( onSelect ).toHaveBeenCalledTimes( 1 );
		const [ range, id ] = onSelect.mock.calls[ 0 ];
		expect( id ).toBe( `year-${ year }` );
		expect( [ range.from.getFullYear(), range.from.getMonth(), range.from.getDate() ] ).toEqual( [
			year,
			0,
			1,
		] );
		expect( [ range.to.getFullYear(), range.to.getMonth(), range.to.getDate() ] ).toEqual( [
			year,
			11,
			31,
		] );
	} );

	it( 'selects all time from the start of the oldest year listed', async () => {
		const user = userEvent.setup();
		const { onSelect } = renderFilter( { startYear: 2019 } );

		await user.click( screen.getByRole( 'button', { name: 'All time' } ) );

		const [ range, id ] = onSelect.mock.calls[ 0 ];
		expect( id ).toBe( 'all-time' );
		expect( range.from.getFullYear() ).toBe( 2019 );
		expect( range.to.getTime() ).toBeGreaterThan( Date.now() ); // Through the end of today.
	} );

	it( 'renders every period in a select when compact', () => {
		renderFilter( { isCompact: true } );

		expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
		expect( screen.getByRole( 'combobox', { name: 'Time period' } ) ).toBeInTheDocument();
	} );

	describe( 'measured layout', () => {
		let originalResizeObserver: typeof ResizeObserver;
		let rectSpy: jest.SpyInstance;

		beforeEach( () => {
			originalResizeObserver = globalThis.ResizeObserver;
			// 4 presets: all time plus three years, so the pills ask for 320px.
			rectSpy = jest
				.spyOn( Element.prototype, 'getBoundingClientRect' )
				.mockReturnValue( { width: PILL_WIDTH } as DOMRect );
		} );

		afterEach( () => {
			globalThis.ResizeObserver = originalResizeObserver;
			rectSpy.mockRestore();
			// Drops the own property a test may have defined, so the body falls
			// back to the prototype's `clientWidth`.
			Reflect.deleteProperty( document.body, 'clientWidth' );
		} );

		it( 'commits the select on the first paint of a narrow container', () => {
			// No resize is reported: the observer's first callback lands after the
			// first paint, so a container read at that point would flash the pills.
			mockContainerResize();
			Object.defineProperty( document.body, 'clientWidth', {
				configurable: true,
				value: 4 * PILL_WIDTH - 1,
			} );

			renderFilter();

			expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
			expect( screen.getByRole( 'combobox', { name: 'Time period' } ) ).toBeInTheDocument();
		} );

		it( 'keeps the pills while they fit the container', () => {
			const { resizeTo } = mockContainerResize();
			renderFilter();

			resizeTo( 4 * PILL_WIDTH );

			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
			expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
		} );

		it( 'collapses to the select once the pills no longer fit', () => {
			const { resizeTo } = mockContainerResize();
			renderFilter();

			resizeTo( 4 * PILL_WIDTH - 1 );

			expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
			expect( screen.getByRole( 'combobox', { name: 'Time period' } ) ).toBeInTheDocument();
		} );

		it( 'goes back to the pills when the container grows again', () => {
			const { resizeTo } = mockContainerResize();
			renderFilter();

			resizeTo( 100 );
			expect( screen.getByRole( 'combobox' ) ).toBeInTheDocument();

			resizeTo( 4 * PILL_WIDTH );
			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
		} );

		it( 'measures a shorter preset list instead of judging it by the previous one', () => {
			const { resizeTo } = mockContainerResize();
			const { rerender } = renderFilter();

			// Four pills ask for 320px, so this container collapses to the select.
			resizeTo( 3 * PILL_WIDTH );
			expect( screen.getByRole( 'combobox' ) ).toBeInTheDocument();

			// One year fewer: three pills fit the same container exactly.
			rerender( { startYear: CURRENT_YEAR - 1 } );

			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 3 );
		} );

		it( 'lets an explicit isCompact override the measurement', () => {
			const { resizeTo } = mockContainerResize();
			renderFilter( { isCompact: false } );

			resizeTo( 100 );

			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 4 );
		} );

		it( 'releases the container it observes when it unmounts', () => {
			const { unobserved } = mockContainerResize();
			const { unmount } = renderFilter();

			unmount();

			expect( unobserved ).toContain( document.body );
		} );
	} );
} );
