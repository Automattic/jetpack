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
// Any non-zero height exercises the same path; the real one comes from the
// stylesheet, which JSDOM does not apply.
const FOOTER_HEIGHT = 24;

/** Roster height with room for `rows` whole rows, and for the footer below them. */
const tileFor = ( rows: number, withFooter = true ) =>
	rows * ROW_HEIGHT + ( withFooter ? FOOTER_HEIGHT : 0 );

const makeItems = ( count: number ): SubscriberListItem[] =>
	Array.from( { length: count }, ( _, index ) => ( {
		id: `row-${ index }`,
		name: `Person ${ index }`,
		secondaryText: `${ index }d ago`,
	} ) );

/**
 * Mocks the element geometry JSDOM does not calculate: the roster root is the
 * measured box, and the footer takes room from the rows, mirroring the
 * stylesheet (root clamped to tile, `.list` flexes, `.more` does not shrink).
 *
 * @param tileHeight - Starting height of the roster root.
 * @return Handle for resizing the roster and restoring the globals.
 */
const mockLayout = ( tileHeight: number ) => {
	const originalGetRect = Element.prototype.getBoundingClientRect;
	const originalResizeObserver = globalThis.ResizeObserver;
	const box = { height: tileHeight };
	const callbacks = new Set< ResizeObserverCallback >();

	Element.prototype.getBoundingClientRect = function () {
		if ( this.hasAttribute?.( 'data-roster-row' ) ) {
			// eslint-disable-next-line testing-library/no-node-access -- Stubbing layout geometry is DOM-level by nature; there is no Testing Library equivalent.
			const rows = Array.from( this.parentElement?.querySelectorAll( '[data-roster-row]' ) ?? [] );
			const index = rows.indexOf( this );
			const bottom = ( index + 1 ) * ROW_HEIGHT;
			return { top: bottom - ROW_HEIGHT, bottom, height: ROW_HEIGHT } as DOMRect;
		}

		if ( this.hasAttribute?.( 'data-roster-footer' ) ) {
			return { top: 0, bottom: FOOTER_HEIGHT, height: FOOTER_HEIGHT } as DOMRect;
		}

		// The roster root holds the rows as grandchildren; the list box that holds
		// them directly is never measured.
		// eslint-disable-next-line testing-library/no-node-access -- Identifying the measured container requires a DOM query.
		if ( this.querySelector?.( ':scope > * > [data-roster-row]' ) ) {
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

const footerText = () => screen.queryByText( /more$/ )?.textContent ?? null;

describe( 'SubscriberList fitRows', () => {
	let layout: ReturnType< typeof mockLayout > | undefined;

	afterEach( () => {
		layout?.restore();
		layout = undefined;
	} );

	it( 'hides the rows that do not fit the tile', () => {
		// Room for four rows; the roster holds ten.
		layout = mockLayout( tileFor( 4 ) );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toEqual( [ 'Person 0', 'Person 1', 'Person 2', 'Person 3' ] );
	} );

	it( 'counts the rows it hid in the "N more" footer', () => {
		layout = mockLayout( tileFor( 4 ) );

		// Six rows hidden here, plus the twenty the caller never fetched.
		render( <SubscriberList items={ makeItems( 10 ) } moreCount={ 20 } /> );

		expect( footerText() ).toBe( '26 more' );
	} );

	it( 'shows the footer even when the caller had no further rows', () => {
		layout = mockLayout( tileFor( 4 ) );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( footerText() ).toBe( '6 more' );
	} );

	it( 'refits when the tile is resized', () => {
		layout = mockLayout( tileFor( 4 ) );

		render( <SubscriberList items={ makeItems( 10 ) } /> );
		expect( visibleNames() ).toHaveLength( 4 );

		layout.resizeTo( tileFor( 7 ) );
		expect( visibleNames() ).toHaveLength( 7 );
		expect( footerText() ).toBe( '3 more' );

		layout.resizeTo( tileFor( 2 ) );
		expect( visibleNames() ).toHaveLength( 2 );
		expect( footerText() ).toBe( '8 more' );
	} );

	it( 'drops no row when the tile shrinks and grows back', () => {
		// The roster fills the tile exactly, so no footer is needed at this size.
		layout = mockLayout( tileFor( 4, false ) );

		render( <SubscriberList items={ makeItems( 4 ) } /> );
		expect( visibleNames() ).toHaveLength( 4 );
		expect( footerText() ).toBeNull();

		layout.resizeTo( tileFor( 1, false ) );
		layout.resizeTo( tileFor( 4, false ) );

		// The footer must give its room back, or the roster settles a row short.
		expect( visibleNames() ).toHaveLength( 4 );
		expect( footerText() ).toBeNull();
	} );

	it( 'keeps a row whose bottom overshoots only by subpixel rounding', () => {
		layout = mockLayout( tileFor( 4 ) - SUBPIXEL_TOLERANCE );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toHaveLength( 4 );
	} );

	it( 'renders every row when fitting is off', () => {
		layout = mockLayout( tileFor( 4 ) );

		render( <SubscriberList items={ makeItems( 10 ) } fitRows={ false } /> );

		expect( visibleNames() ).toHaveLength( 10 );
		expect( footerText() ).toBeNull();
	} );

	it( 'shows every row when the roster has no height to measure against', () => {
		// A collapsed ancestor would otherwise report that not one row fits.
		layout = mockLayout( 0 );

		render( <SubscriberList items={ makeItems( 10 ) } /> );

		expect( visibleNames() ).toHaveLength( 10 );
		expect( footerText() ).toBeNull();
	} );
} );
