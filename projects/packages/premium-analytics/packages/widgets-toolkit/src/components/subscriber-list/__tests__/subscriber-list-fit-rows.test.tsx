/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { SubscriberList } from '../subscriber-list';
import { SUBPIXEL_TOLERANCE } from '../use-fitted-roster-rows';
import type { SubscriberListItem } from '../subscriber-list';

const ROW_HEIGHT = 48;

const makeItems = ( count: number ): SubscriberListItem[] =>
	Array.from( { length: count }, ( _, index ) => ( {
		id: `row-${ index }`,
		name: `Person ${ index }`,
		secondaryText: `${ index }d ago`,
	} ) );

/**
 * Mocks the element geometry that JSDOM does not calculate.
 *
 * @param listHeight - Starting height of the roster's list container.
 * @return Handle for resizing the container and restoring the globals.
 */
const mockLayout = ( listHeight: number ) => {
	const originalGetRect = Element.prototype.getBoundingClientRect;
	const originalResizeObserver = globalThis.ResizeObserver;
	const box = { height: listHeight };
	const callbacks = new Set< ResizeObserverCallback >();

	Element.prototype.getBoundingClientRect = function () {
		if ( this.hasAttribute?.( 'data-roster-row' ) ) {
			// eslint-disable-next-line testing-library/no-node-access -- Stubbing layout geometry is DOM-level by nature; there is no Testing Library equivalent.
			const rows = Array.from( this.parentElement?.querySelectorAll( '[data-roster-row]' ) ?? [] );
			const index = rows.indexOf( this );
			const bottom = ( index + 1 ) * ROW_HEIGHT;
			return { top: bottom - ROW_HEIGHT, bottom, height: ROW_HEIGHT } as DOMRect;
		}

		// eslint-disable-next-line testing-library/no-node-access -- Identifying the measured container requires a DOM query.
		if ( this.querySelector?.( ':scope > [data-roster-row]' ) ) {
			return { top: 0, bottom: box.height, height: box.height } as DOMRect;
		}

		return originalGetRect.call( this );
	};

	globalThis.ResizeObserver = class {
		#callback: ResizeObserverCallback;

		constructor( callback: ResizeObserverCallback ) {
			this.#callback = callback;
		}

		observe() {
			callbacks.add( this.#callback );
		}

		unobserve() {}

		disconnect() {
			callbacks.delete( this.#callback );
		}
	} as unknown as typeof globalThis.ResizeObserver;

	return {
		resizeTo( height: number ) {
			box.height = height;
			act( () => {
				callbacks.forEach( callback =>
					callback( [] as unknown as ResizeObserverEntry[], {} as ResizeObserver )
				);
			} );
		},
		restore() {
			Element.prototype.getBoundingClientRect = originalGetRect;
			globalThis.ResizeObserver = originalResizeObserver;
		},
	};
};

// Ignore rows hidden by the fitting logic.
const visibleNames = () =>
	screen
		.getAllByText( /^Person \d+$/, { ignore: '[aria-hidden="true"], [aria-hidden="true"] *' } )
		.map( el => el.textContent );

describe( 'SubscriberList fitRows', () => {
	let layout: ReturnType< typeof mockLayout >;

	afterEach( () => {
		layout?.restore();
	} );

	it( 'hides the rows that do not fit the tile', () => {
		// Room for four rows; the roster holds ten.
		layout = mockLayout( 4 * ROW_HEIGHT );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toEqual( [ 'Person 0', 'Person 1', 'Person 2', 'Person 3' ] );
	} );

	it( 'counts the rows it hid in the "N more" footer', () => {
		layout = mockLayout( 4 * ROW_HEIGHT );

		// Six rows hidden here, plus the twenty the caller never fetched.
		render( <SubscriberList items={ makeItems( 10 ) } moreCount={ 20 } /> );

		expect( screen.getByText( '26 more' ) ).toBeInTheDocument();
	} );

	it( 'shows the footer even when the caller had no further rows', () => {
		layout = mockLayout( 4 * ROW_HEIGHT );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( screen.getByText( '6 more' ) ).toBeInTheDocument();
	} );

	it( 'refits when the tile is resized', () => {
		layout = mockLayout( 4 * ROW_HEIGHT );

		render( <SubscriberList items={ makeItems( 10 ) } /> );
		expect( visibleNames() ).toHaveLength( 4 );

		layout.resizeTo( 7 * ROW_HEIGHT );
		expect( visibleNames() ).toHaveLength( 7 );
		expect( screen.getByText( '3 more' ) ).toBeInTheDocument();

		layout.resizeTo( 2 * ROW_HEIGHT );
		expect( visibleNames() ).toHaveLength( 2 );
		expect( screen.getByText( '8 more' ) ).toBeInTheDocument();
	} );

	it( 'keeps a row whose bottom overshoots only by subpixel rounding', () => {
		layout = mockLayout( 4 * ROW_HEIGHT - SUBPIXEL_TOLERANCE );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toHaveLength( 4 );
	} );

	it( 'renders every row when fitting is off', () => {
		layout = mockLayout( 4 * ROW_HEIGHT );

		render( <SubscriberList items={ makeItems( 10 ) } fitRows={ false } /> );

		expect( visibleNames() ).toHaveLength( 10 );
		expect( screen.queryByText( /more$/ ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to showing every row when the rows cannot be measured', () => {
		// JSDOM reports zero-sized rects without the layout mock.
		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toHaveLength( 10 );
	} );
} );
