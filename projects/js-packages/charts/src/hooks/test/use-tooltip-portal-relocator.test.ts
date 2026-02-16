/* eslint-disable testing-library/no-node-access */
import { renderHook } from '@testing-library/react';
import { useTooltipPortalRelocator } from '../use-tooltip-portal-relocator';

/**
 * Create a mock visx tooltip portal node for testing.
 * @return {HTMLDivElement} A div mimicking a visx tooltip portal.
 */
function createVisxPortalNode(): HTMLDivElement {
	const portal = document.createElement( 'div' );
	const child = document.createElement( 'div' );
	child.className = 'visx-tooltip';
	portal.appendChild( child );
	return portal;
}

describe( 'useTooltipPortalRelocator', () => {
	let nativeRemoveChild: typeof document.body.removeChild;

	beforeAll( () => {
		nativeRemoveChild = document.body.removeChild;
	} );

	afterEach( () => {
		// Restore native removeChild and clear all body children to prevent
		// leaked portals from interfering with subsequent tests.
		document.body.removeChild = nativeRemoveChild;
		while ( document.body.firstChild ) {
			nativeRemoveChild.call( document.body, document.body.firstChild );
		}
	} );

	test( 'does nothing when containerRef is undefined', () => {
		const { unmount } = renderHook( () => useTooltipPortalRelocator( undefined ) );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );
		expect( portal.parentNode ).toBe( document.body );
		unmount();
	} );

	test( 'does nothing when containerRef.current is null', () => {
		const nullRef = { current: null };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( nullRef ) );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );
		expect( portal.parentNode ).toBe( document.body );
		unmount();
	} );

	test( 'relocates existing visx portal nodes into the container', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		expect( portal.parentNode ).toBe( container );
		unmount();
	} );

	test( 'applies correct positioning styles to relocated portals', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		expect( portal ).toHaveStyle( { position: 'fixed' } );
		expect( portal ).toHaveStyle( { top: '0px' } );
		expect( portal ).toHaveStyle( { left: '0px' } );
		expect( portal ).toHaveStyle( { width: '0px' } );
		expect( portal ).toHaveStyle( { height: '0px' } );
		expect( portal ).toHaveStyle( { overflow: 'visible' } );
		expect( portal ).toHaveStyle( { zIndex: '1' } );
		expect( portal ).toHaveStyle( { pointerEvents: 'none' } );
		unmount();
	} );

	test( 'does not relocate non-visx nodes', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		const regularDiv = document.createElement( 'div' );
		regularDiv.id = 'some-id';
		document.body.appendChild( regularDiv );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		expect( regularDiv.parentNode ).toBe( document.body );
		unmount();
	} );

	test( 'observes and relocates newly added portal nodes', async () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		const portal = createVisxPortalNode();
		document.body.appendChild( portal );

		// MutationObserver is async — wait for microtask
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( portal.parentNode ).toBe( container );
		unmount();
	} );

	test( 'patched removeChild handles relocated nodes without throwing', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		// Portal is now in container, but visx will call document.body.removeChild(portal)
		expect( portal.parentNode ).toBe( container );
		expect( () => document.body.removeChild( portal ) ).not.toThrow();
		expect( portal.parentNode ).toBeNull();
		unmount();
	} );

	test( 'patched removeChild delegates to original for non-relocated nodes', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		const regularDiv = document.createElement( 'div' );
		document.body.appendChild( regularDiv );
		expect( () => document.body.removeChild( regularDiv ) ).not.toThrow();
		expect( regularDiv.parentNode ).toBeNull();
		unmount();
	} );

	test( 'cleanup restores removeChild when it has not been wrapped by others', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		const originalRemoveChild = document.body.removeChild;
		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		// removeChild should be patched
		expect( document.body.removeChild ).not.toBe( originalRemoveChild );

		unmount();

		// Should be restored
		expect( document.body.removeChild ).toBe( originalRemoveChild );
	} );

	test( 'cleanup leaves removeChild when another wrapper was installed after ours', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		// Simulate another library wrapping removeChild after our patch
		const ourPatch = document.body.removeChild;
		const thirdPartyWrapper = function < T extends Node >( child: T ): T {
			return ourPatch.call( document.body, child );
		};
		document.body.removeChild = thirdPartyWrapper;

		unmount();

		// Should NOT restore — third party wrapper is still in place
		expect( document.body.removeChild ).toBe( thirdPartyWrapper );
	} );

	test( 'cleanup moves relocated nodes back to document.body', () => {
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
		const portal = createVisxPortalNode();
		document.body.appendChild( portal );

		const ref = { current: container };
		const { unmount } = renderHook( () => useTooltipPortalRelocator( ref ) );

		expect( portal.parentNode ).toBe( container );

		unmount();

		// Node should be moved back to body on cleanup
		expect( portal.parentNode ).toBe( document.body );
	} );

	test( 'ref-counting allows multiple instances to share the patch', () => {
		const container1 = document.createElement( 'div' );
		const container2 = document.createElement( 'div' );
		document.body.appendChild( container1 );
		document.body.appendChild( container2 );

		const ref1 = { current: container1 };
		const ref2 = { current: container2 };

		const originalRemoveChild = document.body.removeChild;

		const { unmount: unmountFirst } = renderHook( () => useTooltipPortalRelocator( ref1 ) );
		const patchedFn = document.body.removeChild;
		const { unmount: unmountSecond } = renderHook( () => useTooltipPortalRelocator( ref2 ) );

		// Both should share the same patched removeChild
		expect( document.body.removeChild ).toBe( patchedFn );

		// Unmounting the first should keep the patch (ref count > 0)
		unmountFirst();
		expect( document.body.removeChild ).toBe( patchedFn );

		// Unmounting the second should restore the original
		unmountSecond();
		expect( document.body.removeChild ).toBe( originalRemoveChild );
	} );
} );
