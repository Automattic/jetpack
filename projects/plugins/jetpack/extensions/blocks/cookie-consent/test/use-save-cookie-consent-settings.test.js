import { act, renderHook } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { useSaveCookieConsentSettings } from '../use-save-cookie-consent-settings';

const BANNER = { clientId: 'banner', name: 'jetpack/cookie-consent' };
const TEMPLATE_SAVE = { kind: 'postType', name: 'wp_template', key: 'theme//page' };

jest.mock( '@wordpress/blocks', () => ( { serialize: () => 'updated banner' } ) );
jest.mock( '@wordpress/core-data', () => ( { store: { name: 'core' } } ) );

const setState = state => ( { type: 'SET', state } );
const stateReducer =
	initialState =>
	( state = initialState, action ) =>
		action.type === 'SET' ? { ...state, ...action.state } : state;

/**
 * Render the hook against minimal editor and site settings stores.
 *
 * @param {string} screenBase   - Admin screen the editor runs on.
 * @param {string} postType     - Post type being edited.
 * @param {object} templatePart - Ancestor template part attributes, if any.
 * @return {object} Controls and recorded site settings activity.
 */
function setup( screenBase, postType, templatePart ) {
	window.Jetpack_Editor_Initial_State = { screenBase };

	const loadSettings = jest.fn();
	let edits = {};
	const saved = [];
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/editor', {
			reducer: stateReducer( { postType, isSaving: false } ),
			actions: { setState },
			selectors: {
				isSavingPost: state => state.isSaving,
				isSavingNonPostEntityChanges: () => false,
				getCurrentPostType: state => state.postType,
			},
		} )
	);
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: stateReducer( { block: BANNER, templatePart } ),
			actions: { setState },
			selectors: {
				getBlock: state => state.block,
				getBlockParentsByBlockName: state => ( state.templatePart ? [ 'footer-controller' ] : [] ),
				getBlockAttributes: state => state.templatePart,
			},
		} )
	);
	registry.register(
		createReduxStore( 'core', {
			reducer: stateReducer( {
				savingEntities: [],
				entityBlocks: [ BANNER ],
				savedRecord: { slug: 'footer', theme: 'theme' },
			} ),
			actions: {
				setState,
				editEntityRecord: ( kind, name, id, newEdits ) => {
					edits = newEdits;
					return setState( {} );
				},
				saveEditedEntityRecord: () => {
					saved.push( edits.cookie_consent_template );
					return setState( {} );
				},
			},
			selectors: {
				__experimentalGetEntitiesBeingSaved: state => state.savingEntities,
				getEditedEntityRecord: state => ( { ...state.savedRecord, blocks: state.entityBlocks } ),
				getCurrentTheme: () => ( { stylesheet: 'theme' } ),
				getEntityRecord: () => {
					loadSettings();
					return {};
				},
			},
		} )
	);

	const { unmount } = renderHook( () => useSaveCookieConsentSettings( BANNER.clientId ), {
		wrapper: ( { children } ) => createElement( RegistryProvider, { value: registry }, children ),
	} );

	return {
		editor: registry.dispatch( 'core/editor' ),
		core: registry.dispatch( 'core' ),
		blockEditor: registry.dispatch( 'core/block-editor' ),
		loadSettings,
		saved,
		unmount,
	};
}

describe( 'useSaveCookieConsentSettings', () => {
	const initialState = window.Jetpack_Editor_Initial_State;

	afterEach( () => {
		window.Jetpack_Editor_Initial_State = initialState;
	} );

	it.each( [
		[ 'deleting it from a Site Editor template', 'site-editor', 'wp_template' ],
		[ 'deleting it from a Site Editor page', 'site-editor', 'page' ],
		[ 'deleting it while editing a template in the Page Editor', 'post', 'wp_template' ],
		[ 'deleting it while editing a template part in the Page Editor', 'post', 'wp_template_part' ],
	] )( 'clears the saved banner after %s', async ( label, screenBase, postType ) => {
		const { blockEditor, saved, unmount } = setup( screenBase, postType );

		await act( () => blockEditor.setState( { block: undefined } ) );
		await act( async () => unmount() );

		expect( saved ).toEqual( [ null ] );
	} );

	it.each( [
		[ 'hiding the template on a page', 'post', 'page', 'page', undefined ],
		[ 'hiding the template on a post', 'post', 'post', 'post', undefined ],
		[ 'returning from a template to the page', 'post', 'wp_template', 'page', undefined ],
		[ 'unmounting a block that still exists', 'site-editor', 'wp_template', 'wp_template', BANNER ],
	] )(
		'keeps the saved banner after %s',
		async ( label, screenBase, postType, finalPostType, block ) => {
			const { blockEditor, editor, saved, unmount } = setup( screenBase, postType );

			await act( () => editor.setState( { postType: finalPostType } ) );
			await act( () => blockEditor.setState( { block } ) );
			await act( async () => unmount() );

			expect( saved ).toEqual( [] );
		}
	);

	it.each( [
		[ 'post', 'page', false ],
		[ 'post', 'post', false ],
		[ 'post', 'wp_template', true ],
		[ 'post', 'wp_template_part', true ],
		[ 'site-editor', 'page', true ],
	] )(
		'loads and saves site settings only where the banner can be edited: %s / %s',
		async ( screenBase, postType, isSynced ) => {
			const { editor, core, loadSettings, saved } = setup( screenBase, postType );

			await act( () => editor.setState( { isSaving: true } ) );
			await act( () =>
				core.setState( { savingEntities: [ { ...TEMPLATE_SAVE, name: postType } ] } )
			);
			await act( () => core.setState( { savingEntities: [] } ) );
			await act( () => editor.setState( { isSaving: false } ) );

			expect( saved ).toEqual( isSynced ? [ 'updated banner' ] : [] );
			expect( loadSettings.mock.calls.length > 0 ).toBe( isSynced );
		}
	);

	it.each( [
		[ 'wp_template', [ BANNER ], undefined ],
		[ 'wp_template', [ { clientId: 'group', innerBlocks: [ BANNER ] } ], undefined ],
		[
			'wp_template_part',
			[ { ...BANNER, clientId: 'external-banner' } ],
			{ slug: 'footer', theme: 'theme' },
		],
		[ 'wp_template_part', [ { ...BANNER, clientId: 'external-banner' } ], { slug: 'footer' } ],
	] )(
		'syncs a saved %s after returning to the page',
		async ( postType, entityBlocks, templatePart ) => {
			const { editor, core, loadSettings, saved } = setup( 'post', postType, templatePart );

			await act( () => editor.setState( { postType: 'page' } ) );
			await act( () => editor.setState( { isSaving: true } ) );
			await act( () =>
				core.setState( { savingEntities: [ { ...TEMPLATE_SAVE, name: postType } ], entityBlocks } )
			);
			await act( () => core.setState( { savingEntities: [] } ) );
			await act( () => editor.setState( { isSaving: false } ) );

			expect( saved ).toEqual( [ 'updated banner' ] );
			expect( loadSettings ).toHaveBeenCalled();
		}
	);

	it.each( [
		[ 'another template', TEMPLATE_SAVE, [ { clientId: 'other-banner' } ], undefined ],
		[
			'the template referencing the banner template part',
			TEMPLATE_SAVE,
			[ { clientId: 'footer', name: 'core/template-part', innerBlocks: [] } ],
			{ slug: 'footer', theme: 'theme' },
		],
		[
			'another template part',
			{ ...TEMPLATE_SAVE, name: 'wp_template_part' },
			[ { ...BANNER, clientId: 'external-banner' } ],
			{ slug: 'header', theme: 'theme' },
		],
		[
			'a template part from another theme',
			{ ...TEMPLATE_SAVE, name: 'wp_template_part' },
			[ { ...BANNER, clientId: 'external-banner' } ],
			{ slug: 'footer', theme: 'other-theme' },
		],
	] )( 'does not sync when saving %s', async ( label, entity, entityBlocks, templatePart ) => {
		const { editor, core, loadSettings, saved } = setup( 'post', 'page', templatePart );

		await act( () => editor.setState( { isSaving: true } ) );
		await act( () => core.setState( { savingEntities: [ entity ], entityBlocks } ) );
		await act( () => core.setState( { savingEntities: [] } ) );
		await act( () => editor.setState( { isSaving: false } ) );

		expect( saved ).toEqual( [] );
		expect( loadSettings ).not.toHaveBeenCalled();
	} );
} );
