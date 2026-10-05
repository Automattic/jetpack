/* eslint-disable testing-library/no-unnecessary-act -- ReactDOM roots require act when rendering. */
import { jest } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MeasurableImage } from '../src/MeasurableImage.ts';
import { MeasurableImageStore } from '../src/stores/MeasurableImageStore.ts';
import { commands } from '../src/stores/store.ts';
import { AdminBarToggle, Bubble, Main, Popup } from '../src/ui/React.tsx';

let target;
let root;

function image( url = 'https://example.test/one.png' ) {
	const measurable = new MeasurableImage( document.createElement( 'img' ), () => url, jest.fn() );
	jest.spyOn( measurable, 'getSizeOnPage' ).mockReturnValue( { width: 400, height: 400 } );
	jest.spyOn( measurable, 'getFileSize' ).mockResolvedValue( { width: 800, height: 800 } );
	jest.spyOn( measurable, 'getWeight' ).mockResolvedValue( 100 );
	return new MeasurableImageStore( measurable );
}

beforeEach( () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	commands.setGuideState( 'active' );
	Object.defineProperty( window, 'devicePixelRatio', { configurable: true, value: 1 } );
	target = document.createElement( 'div' );
	document.body.append( target );
	root = createRoot( target );
} );

afterEach( () => {
	act( () => root.unmount() );
	target.remove();
	Object.defineProperty( window, 'scrollY', { configurable: true, value: 0 } );
	jest.useRealTimers();
} );

it( 'persists the toolbar toggle and emits the existing UI state event', async () => {
	const track = jest.fn();
	await act( async () => root.render( <AdminBarToggle href="/guide" tracksCallback={ track } /> ) );
	const link = target.querySelector( 'a' );
	expect( link ).toHaveTextContent( 'Image Guide: Active' );
	act( () => link.dispatchEvent( new MouseEvent( 'click', { bubbles: true, cancelable: true } ) ) );
	expect( link ).toHaveClass( 'paused' );
	expect( link ).toHaveTextContent( 'Image Guide: Paused' );
	expect( localStorage.getItem( 'jetpack-boost-guide' ) ).toBe( 'paused' );
	expect( track ).toHaveBeenCalledWith( 'image_guide_ui_state_change', {
		image_guide_state: 'paused',
	} );
} );

it.each( [
	[ 4, 'medium', '4.0x' ],
	[ 4.01, 'high', '4.0x' ],
	[ 2.5, 'normal', '' ],
	[ 0.99, 'normal', '< 1x' ],
	[ 10.5, 'high', '10x' ],
] )( 'renders ratio %s with severity %s', async ( ratio, severity, text ) => {
	const controller = image();
	commands.updateImage( controller.id, {
		fileSize: { width: ratio * 100, height: 100 },
		sizeOnPage: { width: 100, height: 100 },
		loading: false,
	} );
	await act( async () =>
		root.render( <Bubble index={ 0 } store={ controller } onHover={ jest.fn() } /> )
	);
	expect( target.querySelector( '.interaction-area' ) ).toHaveClass( severity );
	expect( target.querySelector( '.label' ) ).toHaveTextContent( text );
} );

it( 'shows loading, unknown measurements and savings without the compression hint', async () => {
	const controller = image();
	controller.image.getWeight.mockImplementation( () => new Promise( () => {} ) );
	await act( async () =>
		root.render(
			<Popup
				store={ controller }
				size="normal"
				position={ { top: 10, left: 20 } }
				onMouseLeave={ jest.fn() }
			/>
		)
	);
	expect( target ).toHaveTextContent( /Loading\.\.\./ );
	await act( async () =>
		commands.updateImage( controller.id, { loading: false, fileSize: { width: -1, height: -1 } } )
	);
	expect( target ).toHaveTextContent( /Unknown/ );
	expect( target ).toHaveTextContent( /N\/A/ );
	await act( async () =>
		commands.updateImage( controller.id, {
			fileSize: { width: 800, height: 800 },
			sizeOnPage: { width: 400, height: 400 },
			fileWeight: { weight: 600 },
		} )
	);
	expect( target ).toHaveTextContent( /450 KB/ );
	expect( target ).not.toHaveTextContent( /Try using a smaller image/ );
} );

it( 'keeps the same details panel and scroll anchor when switching shared-container images', async () => {
	Object.defineProperty( window, 'scrollY', { configurable: true, value: 100 } );
	const stores = [ image(), image( 'https://example.test/two.png' ) ];
	await act( async () => root.render( <Main stores={ stores } /> ) );
	const bubbles = target.querySelectorAll( '.interaction-area' );
	jest
		.spyOn( bubbles[ 0 ], 'getBoundingClientRect' )
		.mockReturnValue( { top: 20, height: 32, left: 10 } );
	jest
		.spyOn( bubbles[ 1 ], 'getBoundingClientRect' )
		.mockReturnValue( { top: 90, height: 32, left: 60 } );
	await act( async () =>
		bubbles[ 0 ].dispatchEvent( new MouseEvent( 'mouseover', { bubbles: true } ) )
	);
	const popup = target.querySelector( '.jetpack-boost-guide-popup' );
	expect( popup ).toHaveStyle( { top: '62px' } );
	await act( async () =>
		bubbles[ 1 ].dispatchEvent( new MouseEvent( 'mouseover', { bubbles: true } ) )
	);
	expect( target.querySelector( '.jetpack-boost-guide-popup' ) ).toBe( popup );
	expect( popup ).toHaveTextContent( /two\.png/ );
	expect( popup ).toHaveStyle( { left: '60px' } );
	expect( popup ).toHaveStyle( { top: '62px' } );
	Object.defineProperty( window, 'scrollY', { configurable: true, value: 130 } );
	act( () => window.dispatchEvent( new Event( 'scroll' ) ) );
	expect( popup ).toHaveStyle( { top: '32px' } );
	act( () =>
		bubbles[ 1 ].dispatchEvent(
			new MouseEvent( 'mouseout', { bubbles: true, relatedTarget: popup } )
		)
	);
	expect( target.querySelector( '.jetpack-boost-guide-popup' ) ).toBe( popup );
} );

it( 'retains the exiting guide for its staggered fly duration and cancels removal on resume', async () => {
	const stores = [ image(), image() ];
	await act( async () => root.render( <Main stores={ stores } /> ) );
	jest.useFakeTimers();
	await act( async () => commands.setGuideState( 'paused' ) );
	expect( target.querySelectorAll( '.jb-ig-exit' ) ).toHaveLength( 2 );
	act( () => jest.advanceTimersByTime( 299 ) );
	expect( target.querySelectorAll( '.spinner' ) ).toHaveLength( 2 );
	act( () => jest.advanceTimersByTime( 1 ) );
	expect( target.querySelector( '.spinner' ) ).not.toBeInTheDocument();
	act( () => jest.advanceTimersByTime( 149 ) );
	expect( target.querySelector( '.guide' ) ).toBeInTheDocument();
	await act( async () => commands.setGuideState( 'active' ) );
	act( () => jest.advanceTimersByTime( 1 ) );
	expect( target.querySelector( '.guide' ) ).toBeInTheDocument();
	expect( target.querySelector( '.jb-ig-exit' ) ).not.toBeInTheDocument();
	await act( async () => commands.setGuideState( 'paused' ) );
	act( () => jest.advanceTimersByTime( 450 ) );
	expect( target.querySelector( '.guide' ) ).not.toBeInTheDocument();
} );
