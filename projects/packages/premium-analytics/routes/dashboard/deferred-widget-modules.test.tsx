/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
/**
 * Internal dependencies
 */
import { deferOffscreenWidgets } from './deferred-widget-modules';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const RENDER_MODULE = 'test/chart/render';
const WIDGET_TEXT = `widget ${ RENDER_MODULE }`;

let observerCallback: IntersectionObserverCallback | null = null;

class MockIntersectionObserver {
	constructor( callback: IntersectionObserverCallback ) {
		observerCallback = callback;
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
 * @param resolve - The underlying resolver.
 */
async function mountDeferred( resolve: ReturnType< typeof makeResolver > ) {
	const resolveModule = deferOffscreenWidgets( resolve, new Set( [ RENDER_MODULE ] ) );
	const { default: Widget } = await resolveModule( RENDER_MODULE );
	render(
		<Suspense fallback={ null }>
			<Widget { ...( {} as WidgetRenderProps< unknown > ) } />
		</Suspense>
	);
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

	it( 'loads a widget near the viewport in the first render', async () => {
		placeAt( 700 );
		const resolve = makeResolver();

		await mountDeferred( resolve );

		await expect( screen.findByText( WIDGET_TEXT ) ).resolves.toBeInTheDocument();
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

	it( 'loads at once where IntersectionObserver is missing', async () => {
		delete ( window as { IntersectionObserver?: unknown } ).IntersectionObserver;
		placeAt( 2000 );

		await mountDeferred( makeResolver() );

		await expect( screen.findByText( WIDGET_TEXT ) ).resolves.toBeInTheDocument();
	} );
} );
