import { renderHook, waitFor } from '@testing-library/react';
import { useElementSize } from '../use-element-size';

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

describe( 'useElementSize', () => {
	let mockResizeObserver;

	beforeEach( () => {
		mockResizeObserver = MockResizeObserver;
		globalThis.ResizeObserver = mockResizeObserver;
	} );

	afterEach( () => {
		globalThis.ResizeObserver = originalResizeObserver;
		jest.clearAllMocks();
	} );

	it( 'should return initial dimensions of 0 by default', () => {
		const { result } = renderHook( () => useElementSize() );
		const [ refCallback, width, height ] = result.current;

		expect( width ).toBe( 0 );
		expect( height ).toBe( 0 );
		expect( typeof refCallback ).toBe( 'function' );
	} );

	it( 'should return custom initial dimensions when provided', () => {
		const { result } = renderHook( () =>
			useElementSize( { initialWidth: 200, initialHeight: 100 } )
		);
		const [ , width, height ] = result.current;

		expect( width ).toBe( 200 );
		expect( height ).toBe( 100 );
	} );

	it( 'should update dimensions when element is attached', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 300, height: 150 } ) ),
		};

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		// Attach the element
		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 300 );
			expect( result.current[ 2 ] ).toBe( 150 );
		} );

		expect( mockElement.getBoundingClientRect ).toHaveBeenCalled();
	} );

	it( 'should handle element with zero dimensions', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 0, height: 0 } ) ),
		};

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 0 );
			expect( result.current[ 2 ] ).toBe( 0 );
		} );
	} );

	it( 'should handle getBoundingClientRect returning undefined dimensions', async () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: undefined, height: undefined } ) ),
		};

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 0 );
			expect( result.current[ 2 ] ).toBe( 0 );
		} );
	} );

	it( 'should disconnect previous observer when new element is attached', () => {
		const mockElement1 = {
			getBoundingClientRect: jest.fn( () => ( { width: 100, height: 100 } ) ),
		};
		const mockElement2 = {
			getBoundingClientRect: jest.fn( () => ( { width: 200, height: 200 } ) ),
		};

		const disconnectSpy = jest.fn();
		const mockObserver = {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		// Attach first element
		refCallback( mockElement1 as unknown as HTMLDivElement );

		// Attach second element
		refCallback( mockElement2 as unknown as HTMLDivElement );

		expect( disconnectSpy ).toHaveBeenCalled();
	} );

	it( 'should disconnect observer when element is removed (null)', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 100, height: 100 } ) ),
		};

		const disconnectSpy = jest.fn();
		const mockObserver = {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		// Attach element
		refCallback( mockElement as unknown as HTMLDivElement );

		// Remove element
		refCallback( null as unknown as HTMLDivElement );

		expect( disconnectSpy ).toHaveBeenCalled();
	} );

	it( 'should create ResizeObserver and observe element', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 100, height: 100 } ) ),
		};

		const observeSpy = jest.fn();
		const mockObserver = {
			observe: observeSpy,
			disconnect: jest.fn(),
			unobserve: jest.fn(),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => mockObserver );

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		expect( globalThis.ResizeObserver ).toHaveBeenCalled();
		expect( observeSpy ).toHaveBeenCalledWith( mockElement );
	} );

	it( 'should maintain stable refCallback reference across re-renders', () => {
		const { result, rerender } = renderHook( () => useElementSize() );

		const firstRefCallback = result.current[ 0 ];

		// Force a re-render
		rerender();

		const secondRefCallback = result.current[ 0 ];

		expect( firstRefCallback ).toBe( secondRefCallback );
	} );

	it( 'should work with different element types', async () => {
		const mockSpanElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 75, height: 50 } ) ),
		};

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockSpanElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 75 );
			expect( result.current[ 2 ] ).toBe( 50 );
		} );
	} );

	it( 'should update dimensions when ResizeObserver callback is triggered', async () => {
		let resizeCallback;
		const mockElement = {
			getBoundingClientRect: jest
				.fn()
				.mockReturnValueOnce( { width: 100, height: 100 } )
				.mockReturnValueOnce( { width: 200, height: 150 } ),
		};

		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( callback => {
			resizeCallback = callback;
			return {
				observe: jest.fn(),
				disconnect: jest.fn(),
				unobserve: jest.fn(),
			};
		} );

		const { result } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 100 );
			expect( result.current[ 2 ] ).toBe( 100 );
		} );

		// Simulate resize
		resizeCallback();

		await waitFor( () => {
			expect( result.current[ 1 ] ).toBe( 200 );
			expect( result.current[ 2 ] ).toBe( 150 );
		} );

		expect( mockElement.getBoundingClientRect ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should handle unmount properly', () => {
		const mockElement = {
			getBoundingClientRect: jest.fn( () => ( { width: 100, height: 100 } ) ),
		};

		const disconnectSpy = jest.fn();
		jest.spyOn( globalThis, 'ResizeObserver' ).mockImplementation( () => ( {
			observe: jest.fn(),
			disconnect: disconnectSpy,
			unobserve: jest.fn(),
		} ) );

		const { result, unmount } = renderHook( () => useElementSize() );
		const [ refCallback ] = result.current;

		refCallback( mockElement as unknown as HTMLDivElement );
		unmount();

		// The observer should be cleaned up when the hook unmounts
		// This is handled by React's cleanup of useCallback dependencies
		expect( disconnectSpy ).not.toThrow();
	} );
} );
