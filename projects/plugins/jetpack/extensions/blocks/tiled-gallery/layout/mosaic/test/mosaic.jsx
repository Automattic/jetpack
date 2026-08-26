import { render } from '@testing-library/react';
import Mosaic from '../index';

let observerCallback;
let mockObserved;

jest.mock( 'resize-observer-polyfill', () => {
	return class ResizeObserverMock {
		constructor( cb ) {
			observerCallback = cb;
		}
		observe( el ) {
			mockObserved?.add( el );
		}
		unobserve( el ) {
			mockObserved?.delete( el );
		}
		disconnect() {
			mockObserved?.clear();
		}
	};
} );

describe( 'Mosaic resize loop guard', () => {
	let rafSpy;
	let cafSpy;
	let clientWidthSpy;
	let currentWidth;

	beforeEach( () => {
		observerCallback = undefined;
		currentWidth = 0;
		// Run the queued layout work synchronously so assertions are deterministic.
		rafSpy = jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( cb => {
			cb();
			return 1;
		} );
		cafSpy = jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation( () => {} );
		// The mosaic now lays out against a measured DOM width rather than the
		// ResizeObserver's reported contentRect, so drive the width via clientWidth.
		clientWidthSpy = jest
			.spyOn( window.HTMLElement.prototype, 'clientWidth', 'get' )
			.mockImplementation( () => currentWidth );
	} );

	afterEach( () => {
		rafSpy.mockRestore();
		cafSpy.mockRestore();
		clientWidthSpy.mockRestore();
	} );

	function mountMosaic( onResize ) {
		const images = [
			{ width: 100, height: 100 },
			{ width: 100, height: 100 },
			{ width: 100, height: 100 },
		];
		const renderedImages = images.map( ( img, i ) => (
			<div className="tiled-gallery__item" key={ i }>
				<img data-width="100" data-height="100" alt="" />
			</div>
		) );

		render(
			<Mosaic
				align="center"
				columns={ 3 }
				images={ images }
				layoutStyle="rectangular"
				renderedImages={ renderedImages }
				onResize={ onResize }
			/>
		);
	}

	function fireResize( width ) {
		// The mosaic reads its layout width from the DOM; the ResizeObserver entry is
		// only a trigger, so the reported contentRect value is irrelevant here.
		currentWidth = width;
		observerCallback( [ { contentRect: { width }, target: document.createElement( 'div' ) } ] );
	}

	it( 'recomputes for a real width change but ignores a sub-pixel one', () => {
		const onResize = jest.fn();
		mountMosaic( onResize );

		// Ignore the initial layout pass that runs on mount.
		onResize.mockClear();

		fireResize( 500 );
		expect( onResize ).toHaveBeenCalledTimes( 1 );

		// A sub-pixel change is the signature of the ResizeObserver feedback loop:
		// it must not trigger another layout pass. See JETPACK-1726.
		fireResize( 500.4 );
		expect( onResize ).toHaveBeenCalledTimes( 1 );

		// A genuine resize is still honored.
		fireResize( 560 );
		expect( onResize ).toHaveBeenCalledTimes( 2 );
	} );
} );

describe( 'Mosaic container observation', () => {
	let rafSpy;
	let cafSpy;
	let computedStyleSpy;
	let pendingRaf;

	beforeEach( () => {
		mockObserved = new Set();
		pendingRaf = undefined;
		// Hold the queued pass instead of running it, so the test can decide what the
		// canvas looks like by the time it runs.
		rafSpy = jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( cb => {
			pendingRaf = cb;
			return 1;
		} );
		cafSpy = jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		rafSpy.mockRestore();
		cafSpy.mockRestore();
		computedStyleSpy?.mockRestore();
		computedStyleSpy = undefined;
		mockObserved = undefined;
	} );

	it( 'observes the flex container once the editor has styled the canvas (JETPACK-1726)', () => {
		// The editor styles the canvas *after* the block mounts, so on the first frame
		// the flex ancestors still compute as plain blocks and the walk finds nothing.
		// Resolving the anchor only at mount leaves the observer watching just the
		// gallery — and a gallery whose own box is content-sized never changes on its
		// own, so no pass ever runs and it keeps a stale width forever.
		const flexContainer = document.createElement( 'div' );
		const item = document.createElement( 'div' );
		flexContainer.appendChild( item );
		document.body.appendChild( flexContainer );
		Object.defineProperty( flexContainer, 'clientWidth', { configurable: true, get: () => 800 } );

		let stylesApplied = false;
		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => ( {
			display: stylesApplied && el === flexContainer ? 'flex' : 'block',
			flexDirection: 'row',
			columnGap: 'normal',
		} ) );

		const images = [ { width: 100, height: 100 } ];
		render(
			<Mosaic
				align="center"
				columns={ 1 }
				images={ images }
				layoutStyle="rectangular"
				renderedImages={ images.map( ( img, i ) => (
					<div className="tiled-gallery__item" key={ i }>
						<img data-width="100" data-height="100" alt="" />
					</div>
				) ) }
				onResize={ () => {} }
			/>,
			{ container: item }
		);

		// Mount happened before the canvas was styled: nothing but the gallery.
		expect( mockObserved.has( flexContainer ) ).toBe( false );

		// The editor styles the canvas, then the queued pass runs.
		stylesApplied = true;
		pendingRaf();

		expect( mockObserved.has( flexContainer ) ).toBe( true );

		document.body.removeChild( flexContainer );
	} );
} );

describe( 'Mosaic layout-width anchoring', () => {
	let computedStyleSpy;

	function defineClientWidth( el, width ) {
		Object.defineProperty( el, 'clientWidth', { configurable: true, get: () => width } );
	}

	// Make `flexEl` report as a flex container (with an optional column gap) and
	// every other element as a plain block.
	function mockFlex( flexEl, columnGap = 'normal' ) {
		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => ( {
			display: el === flexEl ? 'flex' : 'block',
			columnGap: el === flexEl ? columnGap : 'normal',
		} ) );
	}

	afterEach( () => {
		if ( computedStyleSpy ) {
			computedStyleSpy.mockRestore();
			computedStyleSpy = undefined;
		}
	} );

	function instanceFor( galleryNode ) {
		// Exercise the geometry helpers without rendering: they only need a ref.
		const mosaic = new Mosaic( {} );
		mosaic.gallery = { current: galleryNode };
		return mosaic;
	}

	it( 'anchors a lone flex item to the container width (deterministic, not its circular content width)', () => {
		// container(flex, 800) > item > wrapper > gallery(content-sized, 300)
		const container = document.createElement( 'div' );
		const item = document.createElement( 'div' );
		const wrapper = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		container.appendChild( item );
		item.appendChild( wrapper );
		wrapper.appendChild( gallery );

		defineClientWidth( container, 800 );
		defineClientWidth( gallery, 300 );

		mockFlex( container );

		const mosaic = instanceFor( gallery );
		expect( mosaic.getFlexContainer() ).toBe( container );
		// Sole flex item: stable container width, NOT the gallery's circular content width.
		expect( mosaic.getLayoutWidth() ).toBe( 800 );
	} );

	it( 'gives each gallery a deterministic equal share when the row holds several galleries', () => {
		// container(flex, 800, 20px gap) > [itemA > galleryA, itemB > galleryB]
		// Two flex items: lay out to a stable (800 - 20) / 2 = 390 share rather than
		// galleryA's own content width, which is circular and varies per reload.
		const container = document.createElement( 'div' );
		const itemA = document.createElement( 'div' );
		const itemB = document.createElement( 'div' );
		const galleryA = document.createElement( 'div' );
		container.appendChild( itemA );
		container.appendChild( itemB );
		itemA.appendChild( galleryA );

		defineClientWidth( container, 800 );
		defineClientWidth( galleryA, 999 ); // own (circular) width must be ignored

		mockFlex( container, '20px' );

		const mosaic = instanceFor( galleryA );
		expect( mosaic.getFlexContainer() ).toBe( container );
		// (800 - 20 * (2 - 1)) / 2 = 390 — independent of galleryA's own width.
		expect( mosaic.getLayoutWidth() ).toBe( 390 );
	} );

	it( 'falls back to the gallery width when there is no flex container', () => {
		const parent = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		parent.appendChild( gallery );

		defineClientWidth( gallery, 620 );

		mockFlex( null ); // no flex ancestor

		const mosaic = instanceFor( gallery );
		expect( mosaic.getFlexContainer() ).toBeNull();
		expect( mosaic.getLayoutWidth() ).toBe( 620 );
	} );

	it( 'stops at the block-canvas root and never lays out against editor chrome (JETPACK-1900)', () => {
		// chrome(flex, 1244) > rootContainer(.is-root-container) > item > wrapper > gallery
		// In a non-iframed editor the only flex ancestor is emotion-styled editor
		// chrome outside the canvas. The walk must stop at the canvas root and fall
		// back to the gallery's own width; laying out against chrome divides its
		// width by its many children and collapses every item to ~105px.
		const chrome = document.createElement( 'div' );
		const rootContainer = document.createElement( 'div' );
		rootContainer.className = 'is-root-container';
		const item = document.createElement( 'div' );
		const wrapper = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		chrome.appendChild( rootContainer );
		rootContainer.appendChild( item );
		item.appendChild( wrapper );
		wrapper.appendChild( gallery );
		// The classless chrome div holds mostly non-item children (style tags).
		for ( let i = 0; i < 8; i++ ) {
			chrome.appendChild( document.createElement( 'style' ) );
		}

		defineClientWidth( chrome, 1244 );
		defineClientWidth( gallery, 620 );

		mockFlex( chrome );

		const mosaic = instanceFor( gallery );
		expect( mosaic.getFlexContainer() ).toBeNull();
		expect( mosaic.getLayoutWidth() ).toBe( 620 );
	} );

	it( 'counts only real flex items, ignoring <style> tags and out-of-flow slots (JETPACK-1900)', () => {
		// container(flex, 800, 20px gap) > [itemA > galleryA, itemB > galleryB, slot(absolute), 8x <style>]
		// Only the two galleries are real flex items, so each gets (800 - 20) / 2 = 390.
		// The style tags and absolutely-positioned popover slot must not inflate the divisor.
		const container = document.createElement( 'div' );
		const itemA = document.createElement( 'div' );
		const itemB = document.createElement( 'div' );
		const galleryA = document.createElement( 'div' );
		const galleryB = document.createElement( 'div' );
		const slot = document.createElement( 'div' );
		container.appendChild( itemA );
		container.appendChild( itemB );
		container.appendChild( slot );
		itemA.appendChild( galleryA );
		itemB.appendChild( galleryB );
		for ( let i = 0; i < 8; i++ ) {
			container.appendChild( document.createElement( 'style' ) );
		}

		defineClientWidth( container, 800 );

		// container is flex (20px gap); the popover slot is taken out of flow.
		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => ( {
			display: el === container ? 'flex' : 'block',
			columnGap: el === container ? '20px' : 'normal',
			position: el === slot ? 'absolute' : 'static',
		} ) );

		const mosaic = instanceFor( galleryA );
		expect( mosaic.getFlexContainer() ).toBe( container );
		expect( mosaic.getLayoutWidth() ).toBe( 390 );
	} );

	it( 'skips a flex ancestor that is itself content-sized and keeps climbing (JETPACK-1726)', () => {
		// stack(flex, column, align-items:center, 1000)
		//   > columns(flex, row) > column > wrapper > gallery
		//
		// `columns` is a cross-axis child of a column-direction flex container whose
		// align-items is not stretch, so its width is shrink-to-fit — decided by the
		// gallery it contains. Anchoring to it feeds our own layout back into the
		// width we lay out against, and the gallery grows without bound.
		const stack = document.createElement( 'div' );
		const columns = document.createElement( 'div' );
		const column = document.createElement( 'div' );
		const wrapper = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		stack.appendChild( columns );
		columns.appendChild( column );
		column.appendChild( wrapper );
		wrapper.appendChild( gallery );

		defineClientWidth( stack, 1000 );
		defineClientWidth( columns, 7641 ); // already ballooned by the feedback loop
		defineClientWidth( gallery, 7633 );

		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => {
			if ( el === stack ) {
				return {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					columnGap: 'normal',
				};
			}
			if ( el === columns ) {
				return { display: 'flex', flexDirection: 'row', alignSelf: 'auto', columnGap: 'normal' };
			}
			return { display: 'block', columnGap: 'normal' };
		} );

		const mosaic = instanceFor( gallery );
		// The content-sized `columns` is skipped in favour of the stack, whose own
		// width is set by the layout around it.
		expect( mosaic.isContentSized( columns, window ) ).toBe( true );
		expect( mosaic.getFlexContainer() ).toBe( stack );
		expect( mosaic.getLayoutWidth() ).toBe( 1000 );
	} );

	it( 'skips a Row nested in a Row, which is shrink-to-fit on the main axis (JETPACK-1726)', () => {
		// outerRow(flex, row, 645) > innerRow(flex, row, flex:0 1 auto) > wrapper > gallery
		//
		// Width is the main axis here, so `innerRow` neither grows nor has a definite
		// basis: it is shrink-to-fit, sized by the gallery inside it. Anchoring to it
		// is circular and the gallery grows without bound.
		const outerRow = document.createElement( 'div' );
		const innerRow = document.createElement( 'div' );
		const wrapper = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		outerRow.appendChild( innerRow );
		innerRow.appendChild( wrapper );
		wrapper.appendChild( gallery );

		defineClientWidth( outerRow, 645 );
		defineClientWidth( innerRow, 18189 ); // already ballooned by the feedback loop

		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => {
			if ( el === outerRow ) {
				return { display: 'flex', flexDirection: 'row', flexGrow: '0', columnGap: 'normal' };
			}
			if ( el === innerRow ) {
				return {
					display: 'flex',
					flexDirection: 'row',
					flexGrow: '0',
					flexBasis: 'auto',
					columnGap: 'normal',
				};
			}
			return { display: 'block', columnGap: 'normal' };
		} );

		const mosaic = instanceFor( gallery );
		expect( mosaic.isContentSized( innerRow, window ) ).toBe( true );
		expect( mosaic.getFlexContainer() ).toBe( outerRow );
		// One flex item in the outer row, so the gallery gets its full width.
		expect( mosaic.getLayoutWidth() ).toBe( 645 );
	} );

	it( 'still anchors to a row-direction container whose item grows to fill it', () => {
		// Same shape, but innerRow has flex-grow: 1, so its width is handed to it by
		// outerRow rather than taken from its content — a perfectly good anchor.
		const outerRow = document.createElement( 'div' );
		const innerRow = document.createElement( 'div' );
		const wrapper = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		outerRow.appendChild( innerRow );
		innerRow.appendChild( wrapper );
		wrapper.appendChild( gallery );

		defineClientWidth( outerRow, 645 );
		defineClientWidth( innerRow, 645 );

		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => {
			if ( el === outerRow ) {
				return { display: 'flex', flexDirection: 'row', flexGrow: '0', columnGap: 'normal' };
			}
			if ( el === innerRow ) {
				return {
					display: 'flex',
					flexDirection: 'row',
					flexGrow: '1',
					flexBasis: 'auto',
					columnGap: 'normal',
				};
			}
			return { display: 'block', columnGap: 'normal' };
		} );

		const mosaic = instanceFor( gallery );
		expect( mosaic.isContentSized( innerRow, window ) ).toBe( false );
		expect( mosaic.getFlexContainer() ).toBe( innerRow );
		expect( mosaic.getLayoutWidth() ).toBe( 645 );
	} );

	it( 'still anchors to a nested flex container that is stretched by its parent', () => {
		// Same shape, but the stack stretches its children, so `columns` fills the
		// stack's width and remains a perfectly good anchor.
		const stack = document.createElement( 'div' );
		const columns = document.createElement( 'div' );
		const column = document.createElement( 'div' );
		const gallery = document.createElement( 'div' );
		stack.appendChild( columns );
		columns.appendChild( column );
		column.appendChild( gallery );

		defineClientWidth( stack, 1000 );
		defineClientWidth( columns, 1000 );

		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => {
			if ( el === stack ) {
				return {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'stretch',
					columnGap: 'normal',
				};
			}
			if ( el === columns ) {
				return { display: 'flex', flexDirection: 'row', alignSelf: 'auto', columnGap: 'normal' };
			}
			return { display: 'block', columnGap: 'normal' };
		} );

		const mosaic = instanceFor( gallery );
		expect( mosaic.isContentSized( columns, window ) ).toBe( false );
		expect( mosaic.getFlexContainer() ).toBe( columns );
		expect( mosaic.getLayoutWidth() ).toBe( 1000 );
	} );

	it( 'gives a stacked gallery the full width instead of a share of it (JETPACK-1726)', () => {
		// stack(flex, column, 1000) > [paragraph, wrapper > gallery, paragraph]
		// Stacked items sit one above the other, so the gallery gets the whole 1000px.
		// Dividing by the item count would strand it at a third of the space.
		const stack = document.createElement( 'div' );
		const before = document.createElement( 'p' );
		const wrapper = document.createElement( 'div' );
		const after = document.createElement( 'p' );
		const gallery = document.createElement( 'div' );
		stack.appendChild( before );
		stack.appendChild( wrapper );
		stack.appendChild( after );
		wrapper.appendChild( gallery );

		defineClientWidth( stack, 1000 );
		defineClientWidth( gallery, 21 );

		computedStyleSpy = jest.spyOn( window, 'getComputedStyle' ).mockImplementation( el => {
			if ( el === stack ) {
				return {
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'stretch',
					columnGap: '20px',
				};
			}
			return { display: 'block', columnGap: 'normal' };
		} );

		const mosaic = instanceFor( gallery );
		expect( mosaic.getFlexContainer() ).toBe( stack );
		expect( mosaic.getLayoutWidth() ).toBe( 1000 );
	} );
} );
