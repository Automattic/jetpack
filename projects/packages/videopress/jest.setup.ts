/**
 * External dependencies
 */
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Increase the default timeout for async tests
jest.setTimeout( 10000 );

// Mock window.matchMedia
Object.defineProperty( window, 'matchMedia', {
	writable: true,
	value: jest.fn().mockImplementation( query => ( {
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(),
		removeListener: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	} ) ),
} );
