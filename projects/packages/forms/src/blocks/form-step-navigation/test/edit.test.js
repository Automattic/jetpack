import { describe, expect, jest, test, beforeEach } from '@jest/globals';

// Mock createBlock to avoid WordPress block registration issues in tests
await jest.unstable_mockModule( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( blockName, attributes ) => ( {
		name: blockName,
		attributes: attributes || {},
		clientId: 'mock-client-id',
	} ) ),
} ) );

// Mock other WordPress dependencies used by edit.js
await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	useBlockProps: jest.fn( () => ( {} ) ),
	useInnerBlocksProps: jest.fn( () => ( {} ) ),
	store: 'core/block-editor',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => ( {
		replaceInnerBlocks: jest.fn(),
		__unstableMarkNextChangeAsNotPersistent: jest.fn(),
	} ) ),
	useSelect: jest.fn( () => ( {
		ancestorStepClientId: null,
		navigationBlocks: [],
	} ) ),
} ) );

await jest.unstable_mockModule( '@wordpress/element', () => ( {
	useEffect: jest.fn(),
} ) );

await jest.unstable_mockModule( '@wordpress/i18n', () => ( {
	__: jest.fn( str => str ),
} ) );

// Mock internal dependencies
await jest.unstable_mockModule( '../../../store/form-step-preview.js', () => ( {
	store: 'jetpack/form-step-preview',
} ) );

await jest.unstable_mockModule( '../../shared/components/form-step-controls/index.js', () => ( {
	default: jest.fn( () => null ),
} ) );

await jest.unstable_mockModule( '../../shared/hooks/use-form-steps.js', () => ( {
	default: jest.fn( () => [] ),
} ) );

await jest.unstable_mockModule( '../../shared/hooks/use-parent-form-client-id.js', () => ( {
	default: jest.fn( () => null ),
} ) );

// Import the functions we want to test after mocks are set up
const { getButtonType, migrateLegacyButton } = await import( '../edit.js' );
const { createBlock } = await import( '@wordpress/blocks' );

describe( 'getButtonType', () => {
	describe( 'core/button blocks (new format)', () => {
		test( 'should identify previous button by form-button-previous class', () => {
			const block = {
				name: 'core/button',
				attributes: {
					className: 'is-style-outline form-button-previous is-previous',
				},
			};

			expect( getButtonType( block ) ).toBe( 'previous' );
		} );

		test( 'should identify next button by form-button-next class', () => {
			const block = {
				name: 'core/button',
				attributes: {
					className: 'form-button-next is-next',
				},
			};

			expect( getButtonType( block ) ).toBe( 'next' );
		} );

		test( 'should identify submit button by form-button-submit class', () => {
			const block = {
				name: 'core/button',
				attributes: {
					className: 'form-button-submit is-submit',
				},
			};

			expect( getButtonType( block ) ).toBe( 'submit' );
		} );

		test( 'should return null for core/button without navigation classes', () => {
			const block = {
				name: 'core/button',
				attributes: {
					className: 'wp-block-button',
				},
			};

			expect( getButtonType( block ) ).toBeNull();
		} );

		test( 'should return null for core/button with empty className', () => {
			const block = {
				name: 'core/button',
				attributes: {},
			};

			expect( getButtonType( block ) ).toBeNull();
		} );
	} );

	describe( 'jetpack/button blocks (legacy format)', () => {
		test( 'should identify previous button by previous-step uniqueId', () => {
			const block = {
				name: 'jetpack/button',
				attributes: {
					uniqueId: 'previous-step',
				},
			};

			expect( getButtonType( block ) ).toBe( 'previous' );
		} );

		test( 'should identify next button by next-step uniqueId', () => {
			const block = {
				name: 'jetpack/button',
				attributes: {
					uniqueId: 'next-step',
				},
			};

			expect( getButtonType( block ) ).toBe( 'next' );
		} );

		test( 'should identify submit button by submit-step uniqueId', () => {
			const block = {
				name: 'jetpack/button',
				attributes: {
					uniqueId: 'submit-step',
				},
			};

			expect( getButtonType( block ) ).toBe( 'submit' );
		} );

		test( 'should return null for jetpack/button without navigation uniqueId', () => {
			const block = {
				name: 'jetpack/button',
				attributes: {
					uniqueId: 'some-other-button',
				},
			};

			expect( getButtonType( block ) ).toBeNull();
		} );

		test( 'should return null for jetpack/button with empty uniqueId', () => {
			const block = {
				name: 'jetpack/button',
				attributes: {},
			};

			expect( getButtonType( block ) ).toBeNull();
		} );
	} );

	describe( 'other block types', () => {
		test( 'should return null for non-button blocks', () => {
			const block = {
				name: 'core/paragraph',
				attributes: {
					content: 'Hello',
				},
			};

			expect( getButtonType( block ) ).toBeNull();
		} );
	} );
} );

describe( 'migrateLegacyButton', () => {
	beforeEach( () => {
		createBlock.mockClear();
	} );

	test( 'should migrate previous button preserving custom text', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'previous-step',
				text: 'Go Back',
			},
		};

		const result = migrateLegacyButton( legacyBlock, 'previous' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				tagName: 'button',
				className: expect.stringContaining( 'form-button-previous' ),
				text: 'Go Back',
			} )
		);
		expect( result.name ).toBe( 'core/button' );
	} );

	test( 'should migrate next button preserving custom text', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Continue',
			},
		};

		const result = migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				tagName: 'button',
				className: expect.stringContaining( 'form-button-next' ),
				text: 'Continue',
			} )
		);
		expect( result.name ).toBe( 'core/button' );
	} );

	test( 'should migrate submit button preserving custom text and setting type', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'submit-step',
				text: 'Send Form',
			},
		};

		const result = migrateLegacyButton( legacyBlock, 'submit' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				tagName: 'button',
				type: 'submit',
				className: expect.stringContaining( 'form-button-submit' ),
				text: 'Send Form',
			} )
		);
		expect( result.name ).toBe( 'core/button' );
	} );

	test( 'should use template text when legacy button has no custom text', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'previous-step',
				// no text attribute
			},
		};

		migrateLegacyButton( legacyBlock, 'previous' );

		// Should be called with template attributes, text should be 'Previous' from template
		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				text: 'Previous',
			} )
		);
	} );

	test( 'should preserve empty string text if explicitly set', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: '',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		// Empty string is falsy, so template text should be used
		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				text: 'Next',
			} )
		);
	} );

	test( 'should preserve palette-based backgroundColor and textColor', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				backgroundColor: 'vivid-red',
				textColor: 'white',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				backgroundColor: 'vivid-red',
				textColor: 'white',
			} )
		);
	} );

	test( 'should map custom colors to style.color object', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'submit-step',
				text: 'Send',
				customBackgroundColor: '#ff0000',
				customTextColor: '#ffffff',
			},
		};

		migrateLegacyButton( legacyBlock, 'submit' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: expect.objectContaining( {
					color: {
						background: '#ff0000',
						text: '#ffffff',
					},
				} ),
			} )
		);
	} );

	test( 'should preserve gradient attribute', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				gradient: 'vivid-cyan-blue-to-vivid-purple',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				gradient: 'vivid-cyan-blue-to-vivid-purple',
			} )
		);
	} );

	test( 'should map customGradient to style.color.gradient', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				customGradient: 'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: expect.objectContaining( {
					color: {
						gradient: 'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
					},
				} ),
			} )
		);
	} );

	test( 'should map borderRadius to style.border.radius', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'previous-step',
				text: 'Back',
				borderRadius: 10,
			},
		};

		migrateLegacyButton( legacyBlock, 'previous' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: expect.objectContaining( {
					border: {
						radius: '10px',
					},
				} ),
			} )
		);
	} );

	test( 'should preserve all style attributes together with custom text', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'submit-step',
				text: 'Send Form',
				backgroundColor: 'vivid-red',
				customTextColor: '#ffffff',
				borderRadius: 5,
			},
		};

		migrateLegacyButton( legacyBlock, 'submit' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				text: 'Send Form',
				backgroundColor: 'vivid-red',
				style: {
					color: { text: '#ffffff' },
					border: { radius: '5px' },
				},
			} )
		);
	} );

	test( 'should not include style object when no custom values exist', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Continue',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		const callArgs = createBlock.mock.calls[ 0 ][ 1 ];
		expect( callArgs ).not.toHaveProperty( 'style' );
	} );

	test( 'should preserve border width from style attribute', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				style: {
					border: { width: '3px', style: 'solid', color: '#000000' },
				},
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: expect.objectContaining( {
					border: { width: '3px', style: 'solid', color: '#000000' },
				} ),
			} )
		);
	} );

	test( 'should preserve font size from style.typography', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'submit-step',
				text: 'Submit',
				style: {
					typography: { fontSize: '22px' },
				},
			},
		};

		migrateLegacyButton( legacyBlock, 'submit' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: expect.objectContaining( {
					typography: { fontSize: '22px' },
				} ),
			} )
		);
	} );

	test( 'should preserve preset fontSize attribute', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				fontSize: 'large',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				fontSize: 'large',
			} )
		);
	} );

	test( 'should convert width from string to number', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'next-step',
				text: 'Next',
				width: '75',
			},
		};

		migrateLegacyButton( legacyBlock, 'next' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				width: 75,
			} )
		);
	} );

	test( 'should merge explicit attributes with existing style object', () => {
		const legacyBlock = {
			name: 'jetpack/button',
			attributes: {
				uniqueId: 'submit-step',
				text: 'Send',
				customBackgroundColor: '#ff0000',
				borderRadius: 8,
				style: {
					border: { width: '2px', style: 'dashed' },
					typography: { fontSize: '18px', fontFamily: 'serif' },
				},
			},
		};

		migrateLegacyButton( legacyBlock, 'submit' );

		expect( createBlock ).toHaveBeenCalledWith(
			'core/button',
			expect.objectContaining( {
				style: {
					color: { background: '#ff0000' },
					border: { width: '2px', style: 'dashed', radius: '8px' },
					typography: { fontSize: '18px', fontFamily: 'serif' },
				},
			} )
		);
	} );
} );
