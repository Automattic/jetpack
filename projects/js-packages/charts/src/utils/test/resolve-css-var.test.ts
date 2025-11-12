/**
 * @jest-environment jsdom
 */
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

			const result = resolveCssVariable( 'var(--test-color)' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'trims whitespace from computed values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '  #00ff00  ',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--test-color)' );
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

			const result = resolveCssVariable( 'var(--my-custom-color)' );
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

			const result = resolveCssVariable( 'var(--color-123)' );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
		} );
	} );

	describe( 'Whitespace handling', () => {
		it( 'handles CSS variables with spaces inside var()', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--test-color' ) {
						return '#ff0000';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var( --test-color )' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'handles CSS variables with extra spaces around var()', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--test-color' ) {
						return '#ff0000';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(  --test-color  )' );
			expect( result ).toBe( '#ff0000' );
		} );
	} );

	describe( 'Fallback values', () => {
		it( 'returns fallback value when CSS variable is not defined', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-color, #123456)' );
			expect( result ).toBe( '#123456' );
		} );

		it( 'returns computed value over fallback when variable exists', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: ( prop: string ) => {
					if ( prop === '--test-color' ) {
						return '#ff0000';
					}
					return '';
				},
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--test-color, #123456)' );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'handles simple fallback values with spaces', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-color, 10px 20px)' );
			expect( result ).toBe( '10px 20px' );
		} );

		it( 'handles fallback values with extra whitespace', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-color,  #ffffff  )' );
			expect( result ).toBe( '#ffffff  ' );
		} );
	} );

	describe( 'Invalid input handling', () => {
		it( 'returns null for invalid CSS variable syntax', () => {
			const result = resolveCssVariable( 'not-a-var' );
			expect( result ).toBeNull();
		} );

		it( 'returns null for CSS variables without var() wrapper', () => {
			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBeNull();
		} );

		it( 'returns null for empty string', () => {
			const result = resolveCssVariable( '' );
			expect( result ).toBeNull();
		} );

		it( 'returns null for CSS variables without double dash prefix', () => {
			const result = resolveCssVariable( 'var(test-color)' );
			expect( result ).toBeNull();
		} );

		it( 'returns null for malformed var() syntax', () => {
			const result = resolveCssVariable( 'var(--test-color' );
			expect( result ).toBeNull();
		} );

		it( 'returns null for nested var() calls', () => {
			const result = resolveCssVariable( 'var(var(--test-color))' );
			expect( result ).toBeNull();
		} );

		it( 'throws error for CSS variable string longer than 1000 characters', () => {
			const longVar = 'var(--' + 'a'.repeat( 1000 ) + ')';
			expect( () => resolveCssVariable( longVar ) ).toThrow( 'CSS variable is too long' );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'returns null when computed value is empty and no fallback provided', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-color)' );
			expect( result ).toBeNull();
		} );

		it( 'queries document.documentElement for computed styles', () => {
			const mockGetComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '#ff0000',
			} ) );
			window.getComputedStyle = mockGetComputedStyle as unknown as typeof window.getComputedStyle;

			resolveCssVariable( 'var(--test-color)' );

			expect( mockGetComputedStyle ).toHaveBeenCalledWith( document.documentElement );
		} );

		it( 'handles empty fallback values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--undefined-color,)' );
			expect( result ).toBeNull();
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

			const result = resolveCssVariable( 'var(-----)' );
			expect( result ).toBe( 'value' );
		} );
	} );

	describe( 'SSR compatibility', () => {
		it( 'returns null when window is undefined', () => {
			const originalWindow = globalThis.window;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete ( globalThis as any ).window;

			const result = resolveCssVariable( 'var(--test-color)' );
			expect( result ).toBeNull();

			globalThis.window = originalWindow;
		} );

		it( 'returns null when document is undefined', () => {
			const originalDocument = globalThis.document;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			delete ( globalThis as any ).document;

			const result = resolveCssVariable( 'var(--test-color)' );
			expect( result ).toBeNull();

			globalThis.document = originalDocument;
		} );
	} );

	describe( 'Real-world value types', () => {
		it( 'handles hex color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '#3498db',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--primary-color)' );
			expect( result ).toBe( '#3498db' );
		} );

		it( 'handles rgb color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => 'rgb(52, 152, 219)',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--primary-color)' );
			expect( result ).toBe( 'rgb(52, 152, 219)' );
		} );

		it( 'handles rgba color values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => 'rgba(52, 152, 219, 0.5)',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--primary-color)' );
			expect( result ).toBe( 'rgba(52, 152, 219, 0.5)' );
		} );

		it( 'handles pixel values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '16px',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--font-size)' );
			expect( result ).toBe( '16px' );
		} );

		it( 'handles percentage values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '50%',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--width)' );
			expect( result ).toBe( '50%' );
		} );

		it( 'handles em/rem values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '1.5rem',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--spacing)' );
			expect( result ).toBe( '1.5rem' );
		} );

		it( 'handles numeric values', () => {
			window.getComputedStyle = jest.fn( () => ( {
				getPropertyValue: () => '1.5',
			} ) ) as unknown as typeof window.getComputedStyle;

			const result = resolveCssVariable( 'var(--line-height)' );
			expect( result ).toBe( '1.5' );
		} );
	} );
} );
