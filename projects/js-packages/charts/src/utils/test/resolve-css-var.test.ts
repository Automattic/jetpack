import { resolveCssVariable } from '../resolve-css-var';

describe( 'resolveCssVariable', () => {
	let originalGetComputedStyle: typeof window.getComputedStyle;

	beforeEach( () => {
		// Store original getComputedStyle
		originalGetComputedStyle = window.getComputedStyle;
	} );

	afterEach( () => {
		// Restore original getComputedStyle
		window.getComputedStyle = originalGetComputedStyle;
	} );

	describe( 'Basic functionality', () => {
		it( 'resolves a CSS variable that exists on the document root', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--test-color' ) {
						return '#ff0000';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'trims whitespace from computed values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '  #00ff00  ',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBe( '#00ff00' );
		} );

		it( 'handles CSS variable names with hyphens', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--my-custom-color' ) {
						return '#0000ff';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--my-custom-color' );
			expect( result ).toBe( '#0000ff' );
		} );

		it( 'handles CSS variable names with numbers', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--color-123' ) {
						return 'rgb(255, 0, 0)';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--color-123' );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
		} );
	} );

	describe( 'var() syntax handling', () => {
		it( 'resolves var(--name) syntax without fallback', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--my-color' ) {
						return '#ff0000';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--my-color)' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'resolves var(--name, fallback) syntax with fallback', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--jp-white' ) {
						return '#ffffff';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--jp-white, #000000)' );
			expect( result ).toBe( '#ffffff' );
		} );

		it( 'uses fallback when variable is not defined', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '', // Variable not defined
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-var, #fallback)' );
			expect( result ).toBe( '#fallback' );
		} );

		it( 'returns null when variable not defined and no fallback', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '', // Variable not defined
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-var)' );
			expect( result ).toBeNull();
		} );

		it( 'handles var() with extra whitespace', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '', // Variable not defined
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(  --my-var  ,  #abc123  )' );
			expect( result ).toBe( '#abc123' );
		} );

		it( 'handles complex fallback values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '', // Variable not defined
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--color, rgb(255, 0, 0))' );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
		} );
	} );

	describe( 'Regular value passthrough', () => {
		it( 'returns hex color values as-is', () => {
			const result = resolveCssVariable( '#ff0000' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'returns named colors as-is', () => {
			const result = resolveCssVariable( 'red' );
			expect( result ).toBe( 'red' );
		} );

		it( 'returns rgb values as-is', () => {
			const result = resolveCssVariable( 'rgb(255, 0, 0)' );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
		} );
	} );

	describe( 'Invalid input handling', () => {
		it( 'returns null for empty string', () => {
			const result = resolveCssVariable( '' );
			expect( result ).toBeNull();
		} );

		it( 'returns single dash prefix values as-is (not a valid variable)', () => {
			const result = resolveCssVariable( '-test-color' );
			expect( result ).toBe( '-test-color' );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'returns null when computed value is empty', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--undefined-color' );
			expect( result ).toBeNull();
		} );

		it( 'queries document.documentElement for computed styles', () => {
			const mockGetComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '#ff0000',
			} ) );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			resolveCssVariable( '--test-color' );

			expect( mockGetComputedStyle ).toHaveBeenCalledWith( document.documentElement );
		} );

		it( 'handles CSS variables with only hyphens after prefix', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '-----' ) {
						return 'value';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '-----' );
			expect( result ).toBe( 'value' );
		} );
	} );

	describe( 'Real-world value types', () => {
		it( 'handles hex color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '#3498db',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--primary-color' );
			expect( result ).toBe( '#3498db' );
		} );

		it( 'handles rgb color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => 'rgb(52, 152, 219)',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--primary-color' );
			expect( result ).toBe( 'rgb(52, 152, 219)' );
		} );

		it( 'handles rgba color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => 'rgba(52, 152, 219, 0.5)',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--primary-color' );
			expect( result ).toBe( 'rgba(52, 152, 219, 0.5)' );
		} );

		it( 'handles pixel values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '16px',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--font-size' );
			expect( result ).toBe( '16px' );
		} );

		it( 'handles percentage values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '50%',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--width' );
			expect( result ).toBe( '50%' );
		} );

		it( 'handles em/rem values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '1.5rem',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--spacing' );
			expect( result ).toBe( '1.5rem' );
		} );

		it( 'handles numeric values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '1.5',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--line-height' );
			expect( result ).toBe( '1.5' );
		} );
	} );

	describe( 'Error handling', () => {
		it( 'returns null when getComputedStyle throws an error', () => {
			window.getComputedStyle = jest.fn( () => {
				throw new Error( 'Cannot read properties of detached element' );
			} ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBeNull();
		} );

		it( 'handles getPropertyValue throwing an error', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => {
					throw new Error( 'Invalid property access' );
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBeNull();
		} );
	} );

	describe( 'Custom element resolution', () => {
		it( 'resolves CSS variable from a custom element', () => {
			const customElement = document.createElement( 'div' );
			const mockGetComputedStyle = jest.fn( ( element: Element ) => {
				if ( element === customElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--scoped-color' ) {
								return '#00ff00';
							}
							return '';
						},
					};
				}
				return {
					getPropertyValue: () => '',
				};
			} );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--scoped-color', customElement );
			expect( result ).toBe( '#00ff00' );
			expect( mockGetComputedStyle ).toHaveBeenCalledWith( customElement );
		} );

		it( 'falls back to document root when element is null', () => {
			const mockGetComputedStyle = jest.fn( ( element: Element ) => {
				if ( element === document.documentElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--root-color' ) {
								return '#ff0000';
							}
							return '';
						},
					};
				}
				return {
					getPropertyValue: () => '',
				};
			} );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--root-color', null );
			expect( result ).toBe( '#ff0000' );
			expect( mockGetComputedStyle ).toHaveBeenCalledWith( document.documentElement );
		} );

		it( 'falls back to document root when element is undefined', () => {
			const mockGetComputedStyle = jest.fn( ( element: Element ) => {
				if ( element === document.documentElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--root-color' ) {
								return '#ff0000';
							}
							return '';
						},
					};
				}
				return {
					getPropertyValue: () => '',
				};
			} );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--root-color', undefined );
			expect( result ).toBe( '#ff0000' );
			expect( mockGetComputedStyle ).toHaveBeenCalledWith( document.documentElement );
		} );

		it( 'resolves scoped CSS variable that differs from root', () => {
			const scopedElement = document.createElement( 'div' );
			const mockGetComputedStyle = jest.fn( ( element: Element ) => {
				if ( element === scopedElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--brand-color' ) {
								return '#00ff00'; // Scoped value
							}
							return '';
						},
					};
				}
				if ( element === document.documentElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--brand-color' ) {
								return '#ff0000'; // Root value
							}
							return '';
						},
					};
				}
				return {
					getPropertyValue: () => '',
				};
			} );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			// When resolving from scoped element, should get scoped value
			const scopedResult = resolveCssVariable( '--brand-color', scopedElement );
			expect( scopedResult ).toBe( '#00ff00' );

			// When resolving from root (or no element), should get root value
			const rootResult = resolveCssVariable( '--brand-color' );
			expect( rootResult ).toBe( '#ff0000' );
		} );

		it( 'returns null when scoped variable is not defined', () => {
			const scopedElement = document.createElement( 'div' );
			const mockGetComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '', // Variable not defined
			} ) );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--undefined-scoped', scopedElement );
			expect( result ).toBeNull();
		} );

		it( 'handles complex selector scoped elements', () => {
			// Simulate an element with specific classes/attributes like .uLgshq-root[data-wpds-theme-provider-id]
			const themedElement = document.createElement( 'div' );
			themedElement.className = 'uLgshq-root';
			themedElement.setAttribute( 'data-wpds-theme-provider-id', ':rj:' );

			const mockGetComputedStyle = jest.fn( ( element: Element ) => {
				if ( element === themedElement ) {
					return {
						getPropertyValue: ( prop: string ) => {
							if ( prop === '--custom-accent-color' ) {
								return '#c029dc';
							}
							return '';
						},
					};
				}
				return {
					getPropertyValue: () => '',
				};
			} );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( '--custom-accent-color', themedElement );
			expect( result ).toBe( '#c029dc' );
		} );
	} );
} );
