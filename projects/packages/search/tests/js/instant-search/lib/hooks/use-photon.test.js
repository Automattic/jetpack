import { renderHook } from '@testing-library/react';
import { usePhoton } from '../../../../../src/instant-search/lib/hooks/use-photon';

// Mock the photon module
jest.mock( 'photon', () => {
	return jest.fn( ( url, options ) => {
		// Return a mock photon URL
		return `https://i0.wp.com/${ url.replace( /^https?:\/\//, '' ) }?${ options.resize }`;
	} );
} );

describe( 'usePhoton', () => {
	beforeEach( () => {
		// Reset mocks
		jest.clearAllMocks();
	} );

	describe( 'protocol detection', () => {
		test( 'adds https protocol to URLs matching current domain', () => {
			// Jest's testURL is set to https://example.com
			// Test relative URLs that should get the protocol added
			renderHook( () => usePhoton( 'example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'does not add protocol to URLs from different domains', () => {
			// URLs that don't match current domain should remain unchanged
			renderHook( () => usePhoton( 'othersite.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'othersite.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'leaves URLs with existing protocols unchanged', () => {
			renderHook( () => usePhoton( 'https://othersite.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://othersite.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'does not add protocol to subdomain URLs from different domains', () => {
			// Current page is on https://example.com
			// But we're loading an image from sub.example.com
			// We shouldn't assume sub.example.com supports HTTPS
			renderHook( () => usePhoton( 'sub.example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			// Should NOT add protocol - subdomain might not support HTTPS
			expect( photon ).toHaveBeenCalledWith( 'sub.example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'handles protocol-relative URLs (//) by using current page protocol', () => {
			// Jest's testURL is set to https://example.com
			// Protocol-relative URLs should inherit the current page's protocol
			renderHook( () => usePhoton( '//example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'handles protocol-relative URLs from different domains', () => {
			// Protocol-relative URLs from different domains should use the current page's protocol
			// Jest's testURL is set to https://example.com, so //othersite.com becomes https://othersite.com
			renderHook( () => usePhoton( '//othersite.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://othersite.com/image.jpg', {
				resize: '300,200',
			} );
		} );
	} );

	describe( 'URL preparation and query string handling', () => {
		test( 'handles null URLs gracefully', () => {
			renderHook( () => usePhoton( null, 300, 200, true ) );

			const photon = require( 'photon' );
			// Should handle null gracefully and not call photon
			expect( photon ).not.toHaveBeenCalled();
		} );

		test( 'handles malformed URLs gracefully', () => {
			// This URL is malformed in a way that would cause URL parsing to fail
			// and hit the catch block in ensureCorrectProtocol
			// It needs to not have a protocol so it goes through the parsing logic
			renderHook( () => usePhoton( '[invalid-url', 300, 200, true ) );

			const photon = require( 'photon' );
			// Should handle malformed URL gracefully and not call photon
			// because it doesn't have a supported file extension
			expect( photon ).not.toHaveBeenCalled();
		} );

		test( 'strips query strings from URLs without protocols', () => {
			renderHook( () =>
				usePhoton( 'example.com/image.jpg?size=large&format=jpg', 300, 200, true )
			);

			const photon = require( 'photon' );
			// The exact URL passed to photon depends on the Jest environment's window.location
			// but we can verify that query strings are stripped
			expect( photon ).toHaveBeenCalledWith( expect.not.stringMatching( /\?/ ), {
				resize: '300,200',
			} );
		} );

		test( 'strips query strings from URLs with existing protocols', () => {
			renderHook( () =>
				usePhoton( 'https://example.com/image.jpg?size=large&format=jpg', 300, 200, true )
			);

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'leaves URLs with existing protocols unchanged', () => {
			renderHook( () => usePhoton( 'https://example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'leaves URLs with http protocol unchanged', () => {
			renderHook( () => usePhoton( 'http://example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'http://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );
	} );

	describe( 'photon functionality', () => {
		test( 'calls photon with correct parameters when enabled', () => {
			renderHook( () => usePhoton( 'https://example.com/image.jpg', 300, 200, true ) );

			const photon = require( 'photon' );
			expect( photon ).toHaveBeenCalledWith( 'https://example.com/image.jpg', {
				resize: '300,200',
			} );
		} );

		test( 'does not call photon when disabled', () => {
			const { result } = renderHook( () =>
				usePhoton( 'https://example.com/image.jpg', 300, 200, false )
			);

			const photon = require( 'photon' );
			expect( photon ).not.toHaveBeenCalled();
			expect( result.current ).toBe( 'https://example.com/image.jpg' );
		} );

		test( 'does not call photon when disabled with protocol-less URL', () => {
			const { result } = renderHook( () => usePhoton( 'example.com/image.jpg', 300, 200, false ) );

			const photon = require( 'photon' );
			expect( photon ).not.toHaveBeenCalled();
			expect( result.current ).toBe( 'example.com/image.jpg' );
		} );

		test( 'handles unsupported image types', () => {
			const { result } = renderHook( () =>
				usePhoton( 'https://example.com/image.svg', 300, 200, true )
			);

			const photon = require( 'photon' );
			expect( photon ).not.toHaveBeenCalled();
			expect( result.current ).toBe( 'https://example.com/image.svg' );
		} );
	} );
} );
