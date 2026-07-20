import { render } from '@testing-library/react';
import Mosaic from '../index';

let observerCallback;

jest.mock( 'resize-observer-polyfill', () => {
	return class ResizeObserverMock {
		constructor( cb ) {
			observerCallback = cb;
		}
		observe() {}
		unobserve() {}
		disconnect() {}
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
} );
