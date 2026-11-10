/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import { Component, Suspense } from 'react';
/**
 * Internal dependencies
 */
import { deferOffscreenWidgets } from './deferred-widget-modules';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ReactNode } from 'react';

const RENDER_MODULE = 'test/chart/render';
const WIDGET_TEXT = `widget ${ RENDER_MODULE }`;

let observerCallback: IntersectionObserverCallback | null = null;
let suspended = 0;
let observerOptions: IntersectionObserverInit | undefined;

class MockIntersectionObserver {
	constructor( callback: IntersectionObserverCallback, options?: IntersectionObserverInit ) {
		observerCallback = callback;
		observerOptions = options;
	}
	observe() {}
	disconnect() {}
}

/**
 * A resolver whose render module draws a marker.
 *
 * @return The resolver mock.
 */
function makeResolver() {
	return jest.fn( ( id: string ) =>
		Promise.resolve( { default: () => <p>{ `widget ${ id }` }</p> } )
	);
}

/**
 * Mount the deferred stand-in for the test render module.
 *
 * @param resolve   - The underlying resolver.
 * @param container - The element to render into, if not a fresh one.
 */
async function mountDeferred(
	resolve: ReturnType< typeof makeResolver >,
	container?: HTMLElement
) {
	const resolveModule = deferOffscreenWidgets( resolve, new Set( [ RENDER_MODULE ] ) );
	const { default: Widget } = await resolveModule( RENDER_MODULE );
	render(
		<Suspense fallback={ <Suspended /> }>
			<Widget { ...( {} as WidgetRenderProps< unknown > ) } />
		</Suspense>,
		container ? { container } : undefined
	);
}

/**
 * Counts how often the stand-in suspends; the host has already suspended once for the widget.
 *
 * @return Nothing.
 */
function Suspended() {
	suspended++;
	return null;
}

class ErrorBoundary extends Component< { children: ReactNode }, { error: Error | null } > {
	state = { error: null as Error | null };

	static getDerivedStateFromError( error: Error ) {
		return { error };
	}

	render() {
		return this.state.error ? (
			<p>{ `failed: ${ this.state.error.message }` }</p>
		) : (
			this.props.children
		);
	}
}

/**
 * Place every element at a given distance below the top of a 600px viewport.
 *
 * @param top - The top offset in pixels.
 */
function placeAt( top: number ) {
	jest
		.spyOn( HTMLElement.prototype, 'getBoundingClientRect' )
		.mockReturnValue( { top, bottom: top + 200 } as DOMRect );
}

describe( 'deferOffscreenWidgets', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		observerCallback = null;
		suspended = 0;
		window.innerHeight = 600;
		window.IntersectionObserver =
			MockIntersectionObserver as unknown as typeof IntersectionObserver;
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.restoreAllMocks();
		delete ( window as { IntersectionObserver?: unknown } ).IntersectionObserver;
	} );

	it( 'passes ids that are not render modules straight to the resolver', async () => {
		const resolve = makeResolver();
		const resolveModule = deferOffscreenWidgets( resolve, new Set( [ RENDER_MODULE ] ) );

		await resolveModule( 'test/chart/widget' );

		expect( resolve ).toHaveBeenCalledWith( 'test/chart/widget' );
	} );

	it( 'keeps one stand-in per render module, so the dashboard cache stays valid', async () => {
		const resolveModule = deferOffscreenWidgets( makeResolver(), new Set( [ RENDER_MODULE ] ) );

		const first = await resolveModule( RENDER_MODULE );

		await expect( resolveModule( RENDER_MODULE ) ).resolves.toBe( first );
	} );

	it( 'loads a widget near the viewport without suspending again', async () => {
		placeAt( 700 );
		const resolve = makeResolver();

		await mountDeferred( resolve );

		await expect( screen.findByText( WIDGET_TEXT ) ).resolves.toBeInTheDocument();
		expect( suspended ).toBe( 0 );
	} );

	it( 'hands a failed load to the error boundary', async () => {
		placeAt( 700 );
		const resolveModule = deferOffscreenWidgets(
			jest.fn( () => Promise.reject( new Error( 'chunk failed' ) ) ),
			new Set( [ RENDER_MODULE ] )
		);
		const { default: Widget } = await resolveModule( RENDER_MODULE );
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		render(
			<ErrorBoundary>
				<Widget { ...( {} as WidgetRenderProps< unknown > ) } />
			</ErrorBoundary>
		);

		await expect( screen.findByText( 'failed: chunk failed' ) ).resolves.toBeInTheDocument();
	} );

	it( 'holds a widget far below the fold until it nears the viewport', async () => {
		placeAt( 2000 );
		const resolve = makeResolver();

		await mountDeferred( resolve );

		expect( resolve ).not.toHaveBeenCalled();
		expect( screen.getAllByTestId( 'skeleton-line' ).length ).toBeGreaterThan( 0 );

		act( () => {
			observerCallback?.(
				[ { isIntersecting: true } as IntersectionObserverEntry ],
				{} as IntersectionObserver
			);
		} );

		await expect( screen.findByText( WIDGET_TEXT ) ).resolves.toBeInTheDocument();
	} );

	it( 'observes from the scrolling ancestor, with a margin of half its height', async () => {
		const scroller = document.body.appendChild( document.createElement( 'div' ) );
		scroller.style.overflowY = 'auto';
		Object.defineProperties( scroller, {
			scrollHeight: { value: 2000 },
			clientHeight: { value: 400 },
		} );
		// A widget body is `overflow: auto` too, but does not scroll.
		const body = scroller.appendChild( document.createElement( 'div' ) );
		body.style.overflowY = 'auto';
		jest.spyOn( HTMLElement.prototype, 'getBoundingClientRect' ).mockImplementation( function (
			this: HTMLElement
		) {
			return (
				this === scroller
					? { top: 100, bottom: 500, height: 400 }
					: { top: 900, bottom: 1100, height: 200 }
			) as DOMRect;
		} );
		const resolve = makeResolver();

		await mountDeferred( resolve, body );

		expect( resolve ).not.toHaveBeenCalled();
		expect( observerOptions ).toEqual( { root: scroller, rootMargin: '0px 0px 200px 0px' } );
		scroller.remove();
	} );

	it( 'loads at once where IntersectionObserver is missing', async () => {
		delete ( window as { IntersectionObserver?: unknown } ).IntersectionObserver;
		placeAt( 2000 );

		await mountDeferred( makeResolver() );

		await expect( screen.findByText( WIDGET_TEXT ) ).resolves.toBeInTheDocument();
	} );
} );
