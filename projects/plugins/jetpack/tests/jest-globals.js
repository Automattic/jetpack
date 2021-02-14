/**
 * External dependencies
 */
import MutationObserver from '@sheerun/mutationobserver-shim';

window.MutationObserver = MutationObserver;

Object.defineProperty( window, 'matchMedia', {
	value: jest.fn( () => {
		return {
			matches: true,
			addListener: jest.fn(),
			removeListener: jest.fn(),
		};
	} ),
} );
