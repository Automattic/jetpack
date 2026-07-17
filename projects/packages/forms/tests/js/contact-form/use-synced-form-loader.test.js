/**
 * Tests for useSyncedFormLoader hook
 */

import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// Mock WordPress dependencies
const mockUseEffect = jest.fn();
const mockUseRef = jest.fn();

// Track rAF callbacks and cleanup
let rafCallback = null;
let rafId = 1;
let cleanupFn = null;

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useEffect: callback => {
		mockUseEffect( callback );
		cleanupFn = callback();
	},
	useRef: initialValue => {
		const ref = { current: initialValue };
		mockUseRef( ref );
		return ref;
	},
} ) );

await jest.unstable_mockModule( '../../../src/blocks/contact-form/util/form-sync.ts', () => ( {
	filterSyncedAttributes: attrs => attrs,
} ) );

// Mock global requestAnimationFrame and cancelAnimationFrame
jest.spyOn( global, 'requestAnimationFrame' ).mockImplementation( callback => {
	rafCallback = callback;
	return rafId++;
} );

jest.spyOn( global, 'cancelAnimationFrame' ).mockImplementation( () => {
	rafCallback = null;
} );

const { useSyncedFormLoader } = await import(
	'../../../src/blocks/contact-form/hooks/use-synced-form-loader.ts'
);

describe( 'useSyncedFormLoader', () => {
	const defaultProps = {
		ref: 123,
		syncedFormBlocks: [ { name: 'jetpack/field-name', innerBlocks: [] } ],
		syncedFormAttributes: { to: 'test@example.com' },
		clientId: 'test-client-id',
		setAttributes: jest.fn(),
		replaceInnerBlocks: jest.fn(),
		__unstableMarkNextChangeAsNotPersistent: jest.fn(),
		setActiveStep: jest.fn(),
	};

	beforeEach( () => {
		jest.clearAllMocks();
		rafCallback = null;
		rafId = 1;
		cleanupFn = null;
	} );

	afterAll( () => {
		jest.restoreAllMocks();
	} );

	it( 'returns isSyncingRef', () => {
		const { result } = renderHook( () => useSyncedFormLoader( defaultProps ) );

		expect( result.current.isSyncingRef ).toBeDefined();
		expect( result.current.isSyncingRef.current ).toBeDefined();
	} );

	it( 'resets isSyncingRef when cleanup cancels pending rAF', () => {
		// Render the hook - this triggers the effect
		const { result } = renderHook( () => useSyncedFormLoader( defaultProps ) );

		// The effect should have scheduled a rAF
		expect( global.requestAnimationFrame ).toHaveBeenCalled();

		// Simulate isSyncingRef being set to true during sync
		result.current.isSyncingRef.current = true;

		// Simulate cleanup being called (e.g., when deps change or unmount)
		if ( cleanupFn ) {
			cleanupFn();
		}

		// Verify cancelAnimationFrame was called
		expect( global.cancelAnimationFrame ).toHaveBeenCalled();

		// The key assertion: isSyncingRef should be reset to false
		expect( result.current.isSyncingRef.current ).toBe( false );
	} );

	it( 'sets isSyncingRef to false when rAF callback fires', () => {
		const { result } = renderHook( () => useSyncedFormLoader( defaultProps ) );

		// Simulate isSyncingRef being true
		result.current.isSyncingRef.current = true;

		// Fire the rAF callback
		if ( rafCallback ) {
			rafCallback();
		}

		expect( result.current.isSyncingRef.current ).toBe( false );
	} );
} );
