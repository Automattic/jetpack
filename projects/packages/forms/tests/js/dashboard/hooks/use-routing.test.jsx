/**
 * External dependencies
 */
import { renderHook, act, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import {
	useLocation,
	useNavigate,
	useSearchParams,
} from '../../../../src/dashboard/hooks/use-routing';

describe( 'use-routing hooks', () => {
	let originalHash;
	let hashChangeListeners;

	beforeEach( () => {
		// Store original hash
		originalHash = window.location.hash;
		// Reset hash before each test
		window.location.hash = '';
		// Track hashchange event listeners
		hashChangeListeners = [];
		// Mock addEventListener to track listeners
		jest.spyOn( window, 'addEventListener' ).mockImplementation( ( event, listener ) => {
			if ( event === 'hashchange' || event === 'popstate' ) {
				hashChangeListeners.push( listener );
			}
		} );
	} );

	afterEach( () => {
		// Restore original hash
		window.location.hash = originalHash;
		// Clear mocks
		jest.restoreAllMocks();
	} );

	/**
	 * Helper to trigger hashchange event
	 */
	const triggerHashChange = () => {
		hashChangeListeners.forEach( listener => listener() );
	};

	describe( 'useLocation', () => {
		it( 'should return root pathname when hash is empty', () => {
			window.location.hash = '';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '/' );
		} );

		it( 'should return pathname from hash', () => {
			window.location.hash = '#/responses';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '/responses' );
		} );

		it( 'should extract pathname without search params', () => {
			window.location.hash = '#/responses?status=inbox';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '/responses' );
		} );

		it( 'should update pathname when hash changes', () => {
			window.location.hash = '#/';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '/' );

			// Change hash
			act( () => {
				window.location.hash = '#/integrations';
				triggerHashChange();
			} );

			expect( result.current.pathname ).toBe( '/integrations' );
		} );

		it( 'should handle hash with only search params', () => {
			window.location.hash = '#?status=spam';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '' );
		} );

		it( 'should handle complex paths', () => {
			window.location.hash = '#/admin/settings/general';
			const { result } = renderHook( () => useLocation() );

			expect( result.current.pathname ).toBe( '/admin/settings/general' );
		} );
	} );

	describe( 'useNavigate', () => {
		it( 'should navigate to new path', () => {
			const { result } = renderHook( () => useNavigate() );

			act( () => {
				result.current( '/responses' );
			} );

			expect( window.location.hash ).toBe( '#/responses' );
		} );

		it( 'should navigate to path with search params', () => {
			const { result } = renderHook( () => useNavigate() );

			act( () => {
				result.current( '/responses?status=spam' );
			} );

			expect( window.location.hash ).toBe( '#/responses?status=spam' );
		} );

		it( 'should navigate to root path', () => {
			window.location.hash = '#/responses';
			const { result } = renderHook( () => useNavigate() );

			act( () => {
				result.current( '/' );
			} );

			expect( window.location.hash ).toBe( '#/' );
		} );

		it( 'should return stable function reference', () => {
			const { result, rerender } = renderHook( () => useNavigate() );
			const firstRef = result.current;

			rerender();

			expect( result.current ).toBe( firstRef );
		} );
	} );

	describe( 'useSearchParams', () => {
		describe( 'Reading search params', () => {
			it( 'should return empty URLSearchParams when no params exist', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.toString() ).toBe( '' );
				expect( searchParams.get( 'status' ) ).toBeNull();
			} );

			it( 'should parse search params from hash', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.get( 'status' ) ).toBe( 'inbox' );
			} );

			it( 'should parse multiple search params', () => {
				window.location.hash = '#/responses?status=spam&r=1,2,3&search=test';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.get( 'status' ) ).toBe( 'spam' );
				expect( searchParams.get( 'r' ) ).toBe( '1,2,3' );
				expect( searchParams.get( 'search' ) ).toBe( 'test' );
			} );

			it( 'should update when hash changes', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );

				act( () => {
					window.location.hash = '#/?status=spam';
					triggerHashChange();
				} );

				const [ searchParams ] = result.current;
				expect( searchParams.get( 'status' ) ).toBe( 'spam' );
			} );

			it( 'should parse params from path with pathname', () => {
				window.location.hash = '#/responses?status=trash';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.get( 'status' ) ).toBe( 'trash' );
			} );
		} );

		describe( 'Setting search params - Object form', () => {
			it( 'should set search params from object', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: 'spam' } );
				} );

				expect( window.location.hash ).toBe( '#/?status=spam' );
			} );

			it( 'should update existing search params', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: 'spam' } );
				} );

				expect( window.location.hash ).toBe( '#/?status=spam' );
			} );

			it( 'should delete params when value is null', () => {
				window.location.hash = '#/?status=inbox&r=123';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { r: null } );
				} );

				expect( window.location.hash ).toBe( '#/?status=inbox' );
			} );

			it( 'should delete params when value is undefined', () => {
				window.location.hash = '#/?status=inbox&r=123';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { r: undefined } );
				} );

				expect( window.location.hash ).toBe( '#/?status=inbox' );
			} );

			it( 'should preserve pathname when setting params', () => {
				window.location.hash = '#/responses?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: 'spam' } );
				} );

				expect( window.location.hash ).toBe( '#/responses?status=spam' );
			} );

			it( 'should clear all params when empty hash and no search string', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: null } );
				} );

				expect( window.location.hash ).toBe( '#/' );
			} );
		} );

		describe( 'Setting search params - Function form', () => {
			it( 'should set params using function', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( prev => {
						const params = new URLSearchParams( prev );
						params.set( 'status', 'spam' );
						return params;
					} );
				} );

				expect( window.location.hash ).toBe( '#/?status=spam' );
			} );

			it( 'should add new param using function', () => {
				window.location.hash = '#/?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( prev => {
						const params = new URLSearchParams( prev );
						params.set( 'search', 'test' );
						return params;
					} );
				} );

				expect( window.location.hash ).toBe( '#/?status=inbox&search=test' );
			} );

			it( 'should delete param using function', () => {
				window.location.hash = '#/?status=inbox&r=123';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( prev => {
						const params = new URLSearchParams( prev );
						params.delete( 'r' );
						return params;
					} );
				} );

				expect( window.location.hash ).toBe( '#/?status=inbox' );
			} );

			it( 'should receive current params in function', () => {
				window.location.hash = '#/?status=inbox&page=2';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				let receivedParams;
				act( () => {
					setSearchParams( prev => {
						receivedParams = prev;
						return prev;
					} );
				} );

				expect( receivedParams.get( 'status' ) ).toBe( 'inbox' );
				expect( receivedParams.get( 'page' ) ).toBe( '2' );
			} );
		} );

		describe( 'Setting search params - URLSearchParams form', () => {
			it( 'should set params from URLSearchParams', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					const params = new URLSearchParams();
					params.set( 'status', 'spam' );
					params.set( 'r', '1,2,3' );
					setSearchParams( params );
				} );

				expect( window.location.hash ).toBe( '#/?status=spam&r=1%2C2%2C3' );
			} );

			it( 'should replace all params with URLSearchParams', () => {
				window.location.hash = '#/?status=inbox&page=1';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					const params = new URLSearchParams();
					params.set( 'search', 'test' );
					setSearchParams( params );
				} );

				expect( window.location.hash ).toBe( '#/?search=test' );
			} );
		} );

		describe( 'Edge cases', () => {
			it( 'should handle encoded URI components', () => {
				window.location.hash = '#/?search=hello%20world';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.get( 'search' ) ).toBe( 'hello world' );
			} );

			it( 'should handle empty string values', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: '' } );
				} );

				const [ searchParams ] = result.current;
				expect( searchParams.get( 'status' ) ).toBe( '' );
			} );

			it( 'should handle special characters in values', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { search: 'a&b=c?d' } );
				} );

				// URLSearchParams automatically encodes special characters
				expect( window.location.hash ).toContain( 'search=' );
			} );

			it( 'should update internal state when setting params', async () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: 'spam' } );
					triggerHashChange();
				} );

				await waitFor( () => {
					const [ searchParams ] = result.current;
					expect( searchParams.get( 'status' ) ).toBe( 'spam' );
				} );
			} );

			it( 'should handle rapid successive updates', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { status: 'inbox' } );
					setSearchParams( { status: 'spam' } );
					setSearchParams( { status: 'trash' } );
				} );

				expect( window.location.hash ).toBe( '#/?status=trash' );
			} );

			it( 'should preserve pathname with complex path', () => {
				window.location.hash = '#/admin/settings?tab=general';
				const { result } = renderHook( () => useSearchParams() );
				const [ , setSearchParams ] = result.current;

				act( () => {
					setSearchParams( { tab: 'advanced' } );
				} );

				expect( window.location.hash ).toBe( '#/admin/settings?tab=advanced' );
			} );

			it( 'should handle params without pathname', () => {
				window.location.hash = '#?status=inbox';
				const { result } = renderHook( () => useSearchParams() );
				const [ searchParams ] = result.current;

				expect( searchParams.get( 'status' ) ).toBe( 'inbox' );
			} );
		} );

		describe( 'Integration between reading and setting', () => {
			it( 'should read params that were just set', () => {
				window.location.hash = '#/';
				const { result } = renderHook( () => useSearchParams() );

				act( () => {
					const [ , setSearchParams ] = result.current;
					setSearchParams( { status: 'spam', r: '123' } );
					triggerHashChange();
				} );

				const [ searchParams ] = result.current;
				expect( searchParams.get( 'status' ) ).toBe( 'spam' );
				expect( searchParams.get( 'r' ) ).toBe( '123' );
			} );

			it( 'should work with multiple concurrent hooks', () => {
				window.location.hash = '#/?status=inbox';
				const { result: result1 } = renderHook( () => useSearchParams() );
				const { result: result2 } = renderHook( () => useSearchParams() );

				// Both hooks should read the same value
				expect( result1.current[ 0 ].get( 'status' ) ).toBe( 'inbox' );
				expect( result2.current[ 0 ].get( 'status' ) ).toBe( 'inbox' );

				// One hook updates
				act( () => {
					const [ , setSearchParams ] = result1.current;
					setSearchParams( { status: 'spam' } );
					triggerHashChange();
				} );

				// Both hooks should see the update
				expect( result1.current[ 0 ].get( 'status' ) ).toBe( 'spam' );
				expect( result2.current[ 0 ].get( 'status' ) ).toBe( 'spam' );
			} );
		} );
	} );

	describe( 'Integration between hooks', () => {
		it( 'useLocation and useSearchParams should work together', () => {
			window.location.hash = '#/responses?status=spam';
			const { result: locationResult } = renderHook( () => useLocation() );
			const { result: paramsResult } = renderHook( () => useSearchParams() );

			expect( locationResult.current.pathname ).toBe( '/responses' );
			expect( paramsResult.current[ 0 ].get( 'status' ) ).toBe( 'spam' );
		} );

		it( 'useNavigate should update useLocation and useSearchParams', () => {
			window.location.hash = '#/';
			const { result: navigateResult } = renderHook( () => useNavigate() );
			const { result: locationResult } = renderHook( () => useLocation() );
			const { result: paramsResult } = renderHook( () => useSearchParams() );

			act( () => {
				navigateResult.current( '/responses?status=trash&r=1' );
				triggerHashChange();
			} );

			expect( locationResult.current.pathname ).toBe( '/responses' );
			expect( paramsResult.current[ 0 ].get( 'status' ) ).toBe( 'trash' );
			expect( paramsResult.current[ 0 ].get( 'r' ) ).toBe( '1' );
		} );

		it( 'setSearchParams should preserve pathname from useLocation', () => {
			window.location.hash = '#/integrations?status=inbox';
			const { result: locationResult } = renderHook( () => useLocation() );
			const { result: paramsResult } = renderHook( () => useSearchParams() );

			expect( locationResult.current.pathname ).toBe( '/integrations' );

			act( () => {
				const [ , setSearchParams ] = paramsResult.current;
				setSearchParams( { status: 'spam' } );
				triggerHashChange();
			} );

			expect( locationResult.current.pathname ).toBe( '/integrations' );
			expect( paramsResult.current[ 0 ].get( 'status' ) ).toBe( 'spam' );
		} );
	} );
} );
