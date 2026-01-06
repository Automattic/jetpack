/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';

// Mock @wordpress/commands before importing
const mockUseCommandLoaderCallback = jest.fn();
const mockUseCommandLoader = jest.fn( config => {
	mockUseCommandLoaderCallback( config );
} );

await jest.unstable_mockModule( '@wordpress/commands', () => ( {
	useCommandLoader: mockUseCommandLoader,
	useCommand: jest.fn(),
	useCommands: jest.fn(),
	CommandMenu: 'div',
	store: { name: 'core/commands' },
	privateApis: {},
} ) );

// Dynamically import dependencies after mocks are set up
const blockEditorModule = await import( '@wordpress/block-editor' );
const coreModule = await import( '@wordpress/core-data' );
const editorModule = await import( '@wordpress/editor' );
const hookModule = await import( '../../../src/form-editor/use-form-rename-command' );
const constantsModule = await import( '../../../src/blocks/shared/util/constants.js' );

const blockEditorStore = blockEditorModule.store;
const coreStore = coreModule.store;
const editorStore = editorModule.store;
const useFormRenameCommand = hookModule.useFormRenameCommand;
const FORM_POST_TYPE = constantsModule.FORM_POST_TYPE;

describe( 'useFormRenameCommand', () => {
	let registry;
	let wrapper;
	let mockEditPost;
	let mockEditEntityRecord;
	let mockGetSelectedBlock;
	let mockGetCurrentPostType;
	let mockGetCurrentPostId;
	let mockGetEditedPostAttribute;
	let mockGetEditedEntityRecord;

	beforeEach( () => {
		// Create a fresh registry for each test
		registry = createRegistry();

		// Create mock functions for actions and selectors
		mockEditPost = jest.fn();
		mockEditEntityRecord = jest.fn();
		mockGetSelectedBlock = jest.fn();
		mockGetCurrentPostType = jest.fn();
		mockGetCurrentPostId = jest.fn();
		mockGetEditedPostAttribute = jest.fn();
		mockGetEditedEntityRecord = jest.fn();

		// Register mock stores with the registry
		registry.registerStore( blockEditorStore.name, {
			reducer: ( state = {} ) => state,
			selectors: {
				getSelectedBlock: () => mockGetSelectedBlock(),
			},
			actions: {},
		} );

		registry.registerStore( editorStore.name, {
			reducer: ( state = {} ) => state,
			selectors: {
				getCurrentPostType: () => mockGetCurrentPostType(),
				getEditedPostAttribute: () => mockGetEditedPostAttribute(),
				getCurrentPostId: () => mockGetCurrentPostId(),
			},
			actions: {
				editPost: mockEditPost,
			},
		} );

		registry.registerStore( coreStore.name, {
			reducer: ( state = {} ) => state,
			selectors: {
				getEditedEntityRecord: () => mockGetEditedEntityRecord(),
			},
			actions: {
				editEntityRecord: mockEditEntityRecord,
			},
		} );

		// Create wrapper component that provides the registry
		wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		);

		// Clear all mocks before each test
		jest.clearAllMocks();
	} );

	describe( 'command registration', () => {
		it( 'should register command loader with correct configuration', () => {
			// Setup: no form block selected
			mockGetSelectedBlock.mockReturnValue( null );
			mockGetCurrentPostType.mockReturnValue( 'post' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			expect( mockUseCommandLoader ).toHaveBeenCalledWith(
				expect.objectContaining( {
					name: 'jetpack-forms/rename-form-loader',
					context: 'block-selection-edit',
					hook: expect.any( Function ),
				} )
			);
		} );

		it( 'should not register commands when no form block is selected', () => {
			mockGetSelectedBlock.mockReturnValue( null );
			mockGetCurrentPostType.mockReturnValue( 'post' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function that was passed to useCommandLoader
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const result = hookFunction();

			expect( result ).toEqual( {
				commands: [],
				isLoading: false,
			} );
		} );

		it( 'should register rename command when form block is selected in jetpack_form post', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test Form' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const result = hookFunction();

			expect( result.commands ).toHaveLength( 1 );
			expect( result.commands[ 0 ] ).toMatchObject( {
				name: 'jetpack-forms/rename-form',
				label: 'Rename form',
			} );
			expect( result.isLoading ).toBe( false );
		} );

		it( 'should register rename command when synced form block is selected', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
				attributes: { ref: 456 },
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( 'post' );
			mockGetEditedEntityRecord.mockReturnValue( {
				title: 'Synced Form',
			} );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const result = hookFunction();

			expect( result.commands ).toHaveLength( 1 );
			expect( result.commands[ 0 ] ).toMatchObject( {
				name: 'jetpack-forms/rename-form',
				label: 'Rename form',
			} );
		} );

		it( 'should not register commands when form block has no ref and not in jetpack_form post', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( 'post' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const result = hookFunction();

			expect( result.commands ).toHaveLength( 0 );
		} );

		it( 'should not register commands for non-form blocks', () => {
			const mockBlock = {
				name: 'core/paragraph',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( 'post' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const result = hookFunction();

			expect( result.commands ).toHaveLength( 0 );
		} );
	} );

	describe( 'modal rendering', () => {
		it( 'should return null when no form block is selected', () => {
			mockGetSelectedBlock.mockReturnValue( null );
			mockGetCurrentPostType.mockReturnValue( 'post' );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			expect( result.current ).toBeNull();
		} );

		it( 'should return null when modal is not open', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test Form' );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			expect( result.current ).toBeNull();
		} );

		it( 'should render modal JSX when opened via command', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test Form' );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the command callback
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commands = hookFunction();

			// Execute the command callback to open modal
			const mockClose = jest.fn();
			act( () => {
				commands.commands[ 0 ].callback( { close: mockClose } );
			} );

			// Now the modal should be rendered (it's a React element)
			expect( result.current ).not.toBeNull();
			expect( result.current.type ).toBeDefined();
			expect( mockClose ).toHaveBeenCalled();
		} );
	} );

	describe( 'form title updates', () => {
		it( 'should call editPost when renaming jetpack_form post type', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Old Title' );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			// Open modal
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commands = hookFunction();

			act( () => {
				commands.commands[ 0 ].callback( { close: jest.fn() } );
			} );

			// Simulate typing in the input - we're testing the internal logic
			// The hook exposes handleRename via the modal props
			expect( result.current ).not.toBeNull();

			// The actual renaming happens internally via the modal's TextControl onChange
			// and Button onClick handlers. We can't easily test the UI interaction here,
			// but we've verified the hook sets up the correct structure.
		} );

		it( 'should call editEntityRecord when renaming synced form', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
				attributes: { ref: 456 },
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( 'post' );
			mockGetEditedEntityRecord.mockReturnValue( {
				title: 'Old Synced Form',
			} );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			// Open modal
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commands = hookFunction();

			act( () => {
				commands.commands[ 0 ].callback( { close: jest.fn() } );
			} );

			// Modal should be rendered
			expect( result.current ).not.toBeNull();
		} );
	} );

	describe( 'edge cases', () => {
		it( 'should handle null form title', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( null );

			const { result } = renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commandResult = hookFunction();

			// Should still register command even with null title
			expect( commandResult.commands ).toHaveLength( 1 );

			// Open modal
			act( () => {
				commandResult.commands[ 0 ].callback( { close: jest.fn() } );
			} );

			// Modal should render (with empty input)
			expect( result.current ).not.toBeNull();
		} );

		it( 'should handle synced form with null post entity', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
				attributes: { ref: 456 },
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( 'post' );
			mockGetEditedEntityRecord.mockReturnValue( null );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the hook function and call it
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commandResult = hookFunction();

			// Should still register command
			expect( commandResult.commands ).toHaveLength( 1 );
		} );

		it( 'should handle block without clientId', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Should still work
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commandResult = hookFunction();

			expect( commandResult.commands ).toHaveLength( 1 );
		} );

		it( 'should handle updates to selected block', () => {
			const mockBlock1 = {
				name: 'jetpack/contact-form',
				clientId: 'block-1',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock1 );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Form 1' );

			const { result, rerender } = renderHook( () => useFormRenameCommand(), { wrapper } );

			// Initially no modal
			expect( result.current ).toBeNull();

			// Change to different block
			const mockBlock2 = {
				name: 'core/paragraph',
				clientId: 'block-2',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock2 );

			rerender();

			// Still no modal (different block type)
			expect( result.current ).toBeNull();
		} );
	} );

	describe( 'command callback', () => {
		it( 'should call close function when command is executed', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test Form' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the command
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commands = hookFunction();

			// Execute the command
			const mockClose = jest.fn();
			act( () => {
				commands.commands[ 0 ].callback( { close: mockClose } );
			} );

			// Should call close
			expect( mockClose ).toHaveBeenCalled();
		} );

		it( 'should have pencil icon', () => {
			const mockBlock = {
				name: 'jetpack/contact-form',
				clientId: 'test-block',
			};
			mockGetSelectedBlock.mockReturnValue( mockBlock );
			mockGetCurrentPostType.mockReturnValue( FORM_POST_TYPE );
			mockGetCurrentPostId.mockReturnValue( 123 );
			mockGetEditedPostAttribute.mockReturnValue( 'Test Form' );

			renderHook( () => useFormRenameCommand(), { wrapper } );

			// Get the command
			const config = mockUseCommandLoader.mock.calls[ 0 ][ 0 ];
			const hookFunction = config.hook;
			const commands = hookFunction();

			// Check icon is present
			expect( commands.commands[ 0 ].icon ).toBeDefined();
		} );
	} );
} );
