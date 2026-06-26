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

	beforeEach( () => {
		observerCallback = undefined;
		// Run the queued layout work synchronously so assertions are deterministic.
		rafSpy = jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( cb => {
			cb();
			return 1;
		} );
		cafSpy = jest.spyOn( window, 'cancelAnimationFrame' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		rafSpy.mockRestore();
		cafSpy.mockRestore();
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
		// The guard compares widths only; the observed target just needs to be a
		// node the handler can query for rows (there are none here, which is fine).
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
