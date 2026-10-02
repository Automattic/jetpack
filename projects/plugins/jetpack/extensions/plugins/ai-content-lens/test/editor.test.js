import * as data from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';

jest.mock( '../../../blocks/ai-assistant/extensions/lib/can-ai-assistant-be-enabled', () => ( {
	canAIAssistantBeEnabled: () => true,
} ) );
jest.mock( '..', () => ( {
	aiExcerptPluginName: 'ai-content-lens',
	aiExcerptPluginSettings: { render: () => null },
} ) );

const AI_ASSISTANT_BLOCK = 'jetpack/ai-assistant';

const setExtensionAvailability = available => {
	window.Jetpack_Editor_Initial_State = {
		available_blocks: available ? { 'ai-content-lens': { available: true } } : {},
	};
};

describe( 'AI Content Lens editor registration', () => {
	const removeEditorPanel = jest.fn();
	let dispatchSpy;

	beforeAll( () => {
		// The extension only adds its filter when it is available at load time.
		setExtensionAvailability( true );
		require( '../editor' );
	} );

	beforeEach( () => {
		dispatchSpy = jest.spyOn( data, 'dispatch' ).mockReturnValue( { removeEditorPanel } );
	} );

	afterEach( () => {
		dispatchSpy.mockRestore();
		removeEditorPanel.mockClear();
	} );

	afterAll( () => {
		delete window.Jetpack_Editor_Initial_State;
	} );

	it( 'keeps the core excerpt panel when the AI excerpt plugin cannot be registered', () => {
		// Another script replaced the initial state after the filter was added.
		setExtensionAvailability( false );

		applyFilters( 'blocks.registerBlockType', {}, AI_ASSISTANT_BLOCK );

		expect( console ).toHaveWarned();
		expect( removeEditorPanel ).not.toHaveBeenCalled();
	} );

	it( 'replaces the core excerpt panel once the AI excerpt plugin is registered', () => {
		setExtensionAvailability( true );

		applyFilters( 'blocks.registerBlockType', {}, AI_ASSISTANT_BLOCK );

		expect( removeEditorPanel ).toHaveBeenCalledWith( 'post-excerpt' );
	} );
} );
