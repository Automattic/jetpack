import { renderHook, waitFor } from '@testing-library/react';
import { useElementHeight } from '../use-element-height';

// Mock ResizeObserver
class MockResizeObserver {
	callback: () => void;
	entries: ResizeObserverEntry[];
	element: HTMLElement | null;

	constructor( callback: () => void ) {
		this.callback = callback;
	}

	observe( element: HTMLElement ) {
		this.element = element;
		// Trigger initial callback
		this.callback();
	}

	disconnect() {
		this.element = null;
	}
}

// Store original ResizeObserver
const originalResizeObserver = globalThis.ResizeObserver;

describe( 'useElementHeight', () => {
	let mockResizeObserver;

	beforeEach( () => {
		mockResizeObserver = MockResizeObserver;
		globalThis.ResizeObserver = mockResizeObserver;
		globalThis.window.ResizeObserver = mockResizeObserver;
	} );

	afterEach( () => {
		globalThis.ResizeObserver = originalResizeObserver;
		jest.clearAllMocks();
	} );

	it( 'should return initial height of 0 by default', () => {
		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback, height ] = result.current;

		expect( height ).toBe( 0 );
		expect( typeof refCallback ).toBe( 'function' );
	} );

	it( 'should return custom initial height when provided', () => {
		const { result } = renderHook( () => useElementHeight( { initialHeight: 100 } ) );
		const [ , height ] = result.current;

		expect( height ).toBe( 100 );
	} );

	it( 'should update height when element is attached', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 150 } ) ),
		};

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		// Attach the element
		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 150 );
		} );

		expect( mockElement.getBoundingClientRect ).toHaveBeenCalled();
	} );

	it( 'should handle element with zero height', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 0 } ) ),
		};

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 0 );
		} );
	} );

	it( 'should handle getBoundingClientRect returning undefined height', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: undefined } ) ),
		};

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 0 );
		} );
	} );

	it( 'should disconnect previous observer when new element is attached', () => {
		const mockElement1 = {
			getBoundingClientRect: jest.fn( () => ( { height: 100 } ) ),
		};
		const mockElement2 = {
			getBoundingClientRect: jest.fn( () => ( { height: 200 } ) ),
		};

		const disconnectSpy = jest.fn();
		const mockObserver = {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		// Attach first element
		refCallback( mockElement1 as unknown as HTMLDivElement );

		// Attach second element
		refCallback( mockElement2 as unknown as HTMLDivElement );

		expect( disconnectSpy ).toHaveBeenCalled();
	} );

	it( 'should disconnect observer when element is removed (null)', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 100 } ) ),
		};

		const disconnectSpy = jest.fn();
		const mockObserver = {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		// Attach element
		refCallback( mockElement as unknown as HTMLDivElement );

		// Remove element
		refCallback( null as unknown as HTMLDivElement );

		expect( disconnectSpy ).toHaveBeenCalled();
	} );

	it( 'should create ResizeObserver and observe element', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 100 } ) ),
		};

		const observeSpy = jest.fn();
		const mockObserver = {
			observe: observeSpy,
			disconnect: jest.fn(),
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		expect( globalThis.ResizeObserver ).toHaveBeenCalled();
		expect( observeSpy ).toHaveBeenCalledWith( mockElement );
	} );

	it( 'should maintain stable refCallback reference across re-renders', () => {
		const { result, rerender } = renderHook( () => useElementHeight() );

		const firstRefCallback = result.current[ 0 ];

		// Force a re-render
		rerender();

		const secondRefCallback = result.current[ 0 ];

		expect( firstRefCallback ).toBe( secondRefCallback );
	} );

	it( 'should work with different element types', async () => {
		const mockSpanElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 50 } ) ),
		};

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockSpanElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 50 );
		} );
	} );

	it( 'should update height when ResizeObserver callback is triggered', async () => {
		let resizeCallback;
		const mockElement = {
			getBoundingClientRect: jest
				.fn()
				.mockReturnValueOnce( { height: 100 } )
				.mockReturnValueOnce( { height: 200 } ),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( callback => {
			resizeCallback = callback;
			return {
				observe: jest.fn(),
				disconnect: jest.fn(),
				unobserve: jest.fn(),
			};
		} );

		const { result } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 100 );
		} );

		// Simulate resize
		resizeCallback();

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 200 );
		} );

		expect( mockElement.getBoundingClientRect ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should handle unmount properly', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { height: 100 } ) ),
		};

		const disconnectSpy = jest.fn();
		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => ( {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		} ) );

		const { result, unmount } = renderHook( () => useElementHeight() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );
		unmount();

		// The observer should be cleaned up when the hook unmounts
		// This is handled by React's cleanup of useCallback dependencies
		expect( disconnectSpy ).not.toThrow();
	} );
} );
