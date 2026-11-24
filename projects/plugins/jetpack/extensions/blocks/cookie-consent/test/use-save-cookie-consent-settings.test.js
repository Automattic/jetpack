import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import {
	createBlock,
	parse,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import {
	useSaveCookieConsentSettings,
	useSyncCookieConsentSettings,
} from '../use-save-cookie-consent-settings';

jest.mock( '@wordpress/api-fetch' );

const TYPE = 'jetpack/cookie-consent';
const TEMPLATE_ID = 'theme//page';
const setState = state => ( { type: 'SET', state } );
const stateReducer =
	initialState =>
	( state = initialState, action ) =>
		action.type === 'SET' ? { ...state, ...action.state } : state;

function setup( {
	screenBase = 'post',
	postType = 'wp_template',
	content,
	templateParts = [],
} = {} ) {
	window.Jetpack_Editor_Initial_State = { screenBase };
	const banner = createBlock( TYPE, { text: 'Saved banner' } );
	const savedBanner = serialize( [ banner ] );
	const settings = { title: 'Saved title', cookie_consent_template: savedBanner };
	const record = { id: TEMPLATE_ID, content: { raw: content ?? savedBanner } };
	const records = Object.fromEntries(
		[ 'page', 'wp_template', 'wp_template_part' ].map( name => [
			name,
			{ ...record, content: { raw: name === postType ? record.content.raw : '' } },
		] )
	);
	const parts = Object.fromEntries( templateParts.map( part => [ part.id, part ] ) );
	apiFetch.mockImplementation( async ( { path, method, data, parse: shouldParse } ) => {
		if ( method === 'OPTIONS' ) {
			return { schema: { properties: {} } };
		}
		const name = path.split( '/' )[ 3 ].split( '?' )[ 0 ];
		let response;
		if ( name === 'settings' ) {
			Object.assign( settings, data );
			response = { ...settings };
		} else if ( data ) {
			const saved = {
				...record,
				...( method === 'POST' && name === 'wp_template_part'
					? { id: 'theme//new-part', theme: 'theme', slug: 'new-part' }
					: {} ),
				content: { raw: data.content },
			};
			response = saved;
			if ( saved.id === TEMPLATE_ID ) {
				records[ name ] = saved;
			} else {
				parts[ saved.id ] = saved;
			}
		} else {
			const id = path.split( '?' )[ 0 ].split( '/' ).slice( 4 ).join( '/' );
			response = id
				? ( parts[ id ] ?? records[ name ] )
				: [ records[ name ], ...( name === 'wp_template_part' ? Object.values( parts ) : [] ) ];
		}
		return shouldParse === false
			? { headers: new Headers(), json: async () => response }
			: response;
	} );
	const registry = createRegistry();
	registry.register( coreStore );
	registry.register(
		createReduxStore( 'core/editor', {
			reducer: stateReducer( { postType, isSaving: false } ),
			actions: { setState },
			selectors: {
				getCurrentPostType: state => state.postType,
				isSavingPost: state => state.isSaving,
				isSavingNonPostEntityChanges: () => false,
			},
		} )
	);
	registry.register(
		createReduxStore( 'core/block-editor', {
			reducer: stateReducer( { block: banner } ),
			actions: { setState },
			selectors: { getBlock: state => state.block },
		} )
	);
	const core = registry.dispatch( coreStore );
	core.receiveCurrentTheme( { stylesheet: 'theme' } );
	core.addEntities( [
		{ kind: 'root', name: 'theme', baseURL: '/wp/v2/themes' },
		{ kind: 'root', name: 'site', key: false, baseURL: '/wp/v2/settings' },
		...[ 'page', 'wp_template', 'wp_template_part' ].map( name => ( {
			kind: 'postType',
			name,
			baseURL: `/wp/v2/${ name }`,
			rawAttributes: [ 'content' ],
		} ) ),
	] );
	core.receiveEntityRecords( 'root', 'theme', { id: 'theme', stylesheet: 'theme' } );
	core.finishResolution( 'getCurrentTheme', [] );
	core.receiveEntityRecords( 'root', 'site', { ...settings } );
	core.finishResolution( 'getEntityRecord', [ 'root', 'site' ] );
	for ( const name of [ 'page', 'wp_template', 'wp_template_part' ] ) {
		core.receiveEntityRecords( 'postType', name, records[ name ] );
		core.finishResolution( 'getEntityRecord', [ 'postType', name, TEMPLATE_ID ] );
	}
	const wrapper = ( { children } ) =>
		createElement( RegistryProvider, { value: registry }, children );
	if ( screenBase !== 'site-editor' ) {
		renderHook( useSyncCookieConsentSettings, { wrapper } );
	}
	const { unmount } = renderHook( () => useSaveCookieConsentSettings( banner.clientId ), {
		wrapper,
	} );
	const save = async ( name, nextContent ) => {
		await act( async () => {
			await core.editEntityRecord( 'postType', name, TEMPLATE_ID, { content: nextContent } );
			await core.saveEditedEntityRecord( 'postType', name, TEMPLATE_ID );
		} );
	};
	return {
		core,
		registry,
		records,
		settings,
		editor: registry.dispatch( 'core/editor' ),
		blockEditor: registry.dispatch( 'core/block-editor' ),
		save,
		savedBanner,
		unmount,
	};
}

const settingsWrites = () =>
	apiFetch.mock.calls.filter(
		( [ { path, method } ] ) => path === '/wp/v2/settings' && method === 'POST'
	);

describe( 'Cookie Consent settings synchronization', () => {
	const initialState = window.Jetpack_Editor_Initial_State;

	beforeAll( () => {
		registerBlockType( TYPE, {
			apiVersion: 3,
			title: 'Cookie Consent',
			category: 'widgets',
			attributes: { text: { type: 'string' } },
			save: ( { attributes } ) => createElement( 'p', null, attributes.text ),
		} );
	} );

	afterEach( () => {
		window.Jetpack_Editor_Initial_State = initialState;
		apiFetch.mockReset();
	} );

	afterAll( () => unregisterBlockType( TYPE ) );

	it.each( [
		[ 'page to a footer part and back', 'page', 'wp_template_part', 'page' ],
		[ 'template to a footer part and back', 'wp_template', 'wp_template_part', 'wp_template' ],
		[ 'template to the Code editor', 'wp_template', 'wp_template', 'wp_template' ],
	] )(
		'keeps the saved banner when moving from %s without saving',
		async ( label, from, to, back ) => {
			const { editor, blockEditor, unmount } = setup( { postType: from } );

			await act( () => editor.setState( { postType: to } ) );
			await act( () => blockEditor.setState( { block: undefined } ) );
			await act( async () => unmount() );
			await act( () => editor.setState( { postType: back } ) );

			expect( apiFetch ).not.toHaveBeenCalled();
		}
	);

	it.each( [
		[ 'wp_template', false ],
		[ 'wp_template_part', false ],
		[ 'wp_template', true ],
		[ 'wp_template_part', true ],
	] )(
		'clears the banner only after saving a deletion in a %s after the block unmounts (stale copy: %s)',
		async ( name, staleCopy ) => {
			const { core, blockEditor, save, savedBanner, records, unmount } = setup( {
				postType: name,
			} );
			if ( staleCopy ) {
				const other = name === 'wp_template' ? 'wp_template_part' : 'wp_template';
				records[ other ].content.raw = savedBanner.replaceAll( 'Saved banner', 'Old banner' );
			}
			await act( () => core.editEntityRecord( 'postType', name, TEMPLATE_ID, { content: '' } ) );
			await act( () => blockEditor.setState( { block: undefined } ) );
			await act( async () => unmount() );
			expect( settingsWrites() ).toEqual( [] );

			await save( name, '' );

			await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
			expect( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template ).toBeNull();
		}
	);

	it.each( [
		[ 'wp_template', false ],
		[ 'wp_template_part', false ],
		[ 'wp_template_part', true ],
	] )(
		'syncs a saved %s after returning to the page with the block unmounted (nested: %s)',
		async ( name, nested ) => {
			const { editor, blockEditor, save, savedBanner, unmount } = setup( { postType: name } );
			await act( () => editor.setState( { postType: 'page' } ) );
			await act( () => blockEditor.setState( { block: undefined } ) );
			await act( async () => unmount() );

			const content = savedBanner.replaceAll( 'Saved banner', 'Updated banner' );
			await save(
				name,
				nested ? `<!-- wp:group --><div>${ content }</div><!-- /wp:group -->` : content
			);

			await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
			expect( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template ).toContain(
				'Updated banner'
			);
		}
	);

	it( 'keeps the banner after saving a footer part and navigating back to its template', async () => {
		const { editor, blockEditor, save, savedBanner, unmount } = setup();
		await act( () => editor.setState( { postType: 'wp_template_part' } ) );
		await save( 'wp_template_part', savedBanner.replaceAll( 'Saved banner', 'Updated banner' ) );
		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );

		await act( () => editor.setState( { postType: 'wp_template' } ) );
		await act( () => blockEditor.setState( { block: undefined } ) );
		await act( async () => unmount() );

		expect( settingsWrites() ).toHaveLength( 1 );
		expect( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template ).toContain( 'Updated banner' );
	} );

	it.each( [ 'page', 'wp_template' ] )(
		'leaves settings alone when saving an unrelated %s',
		async name => {
			const { save } = setup( { content: name === 'page' ? undefined : '' } );

			await save( name, 'Unrelated content' );

			expect( settingsWrites() ).toEqual( [] );
		}
	);

	it( 'keeps the banner when the template save fails', async () => {
		const { save } = setup();
		apiFetch.mockRejectedValue( new Error( 'Save failed' ) );

		await save( 'wp_template', '' );

		expect( settingsWrites() ).toEqual( [] );
	} );

	it( 'keeps the banner when template and part list requests fail after saving a deletion', async () => {
		const { registry, save } = setup();
		const fetch = apiFetch.getMockImplementation();
		apiFetch.mockImplementation( options => {
			if ( /^\/wp\/v2\/wp_template(?:_part)?\?/.test( options.path ) ) {
				return Promise.reject( new Error( 'List request failed' ) );
			}
			return fetch( options );
		} );

		await save( 'wp_template', '' );
		await waitFor( () =>
			expect(
				[ 'wp_template', 'wp_template_part' ].every( name =>
					registry
						.select( coreStore )
						.hasFinishedResolution( 'getEntityRecords', [
							'postType',
							name,
							{ per_page: -1, context: 'edit' },
						] )
				)
			).toBe( true )
		);

		expect( settingsWrites() ).toEqual( [] );
	} );

	it( 'syncs a banner added to a template that did not have one', async () => {
		const { save, savedBanner } = setup( { content: '' } );

		await save( 'wp_template', savedBanner.replaceAll( 'Saved banner', 'Added banner' ) );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( parse( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template )[ 0 ].name ).toBe(
			TYPE
		);
	} );

	it( 'keeps Site Editor deletion behavior', async () => {
		const { blockEditor, unmount } = setup( { screenBase: 'site-editor' } );

		await act( () => blockEditor.setState( { block: undefined } ) );
		await act( async () => unmount() );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template ).toBeNull();
	} );

	it.each( [ 'wp_template', 'wp_template_part' ] )(
		'keeps a moved banner when %s finishes saving first',
		async first => {
			const { core, registry, savedBanner } = setup();
			const fetch = apiFetch.getMockImplementation();
			const completions = {};
			apiFetch.mockImplementation( async options => {
				if ( options.method === 'PUT' ) {
					await new Promise( resolve => {
						completions[ options.path.split( '/' )[ 3 ] ] = resolve;
					} );
				}
				return fetch( options );
			} );
			let saves;
			await act( async () => {
				core.editEntityRecord( 'postType', 'wp_template', TEMPLATE_ID, { content: '' } );
				core.editEntityRecord( 'postType', 'wp_template_part', TEMPLATE_ID, {
					content: savedBanner,
				} );
				saves = Promise.all(
					[ 'wp_template', 'wp_template_part' ].map( name =>
						core.saveEditedEntityRecord( 'postType', name, TEMPLATE_ID )
					)
				);
			} );
			await waitFor( () => expect( Object.keys( completions ) ).toHaveLength( 2 ) );
			await act( async () => completions[ first ]() );
			const last = first === 'wp_template' ? 'wp_template_part' : 'wp_template';
			await act( async () => {
				completions[ last ]();
				await saves;
			} );

			await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
			expect( registry.select( coreStore ).getEntityRecord( 'root', 'site' ) ).toHaveProperty(
				'cookie_consent_template',
				savedBanner
			);
		}
	);

	it.each( [ 'loaded', 'fetched' ] )(
		'keeps a banner moved to a %s part before the source template is saved',
		async location => {
			const { core, registry, save, savedBanner, records, settings } = setup();
			if ( location === 'loaded' ) {
				await save( 'wp_template_part', savedBanner );
			} else {
				records.wp_template_part = {
					...records.wp_template_part,
					content: { raw: savedBanner },
				};
			}
			await waitFor( () =>
				expect( settingsWrites() ).toHaveLength( location === 'loaded' ? 1 : 0 )
			);
			const currentTemplate = savedBanner.replaceAll( '\n', '\n\n' );
			settings.cookie_consent_template = currentTemplate;
			await act( () =>
				core.receiveEntityRecords( 'root', 'site', { cookie_consent_template: currentTemplate } )
			);

			await save( 'wp_template', '' );
			await waitFor( () =>
				expect(
					[ 'wp_template', 'wp_template_part' ].every( name =>
						registry
							.select( coreStore )
							.hasFinishedResolution( 'getEntityRecords', [
								'postType',
								name,
								{ per_page: -1, context: 'edit' },
							] )
					)
				).toBe( true )
			);

			expect( settingsWrites() ).toHaveLength( location === 'loaded' ? 1 : 0 );
			expect( registry.select( coreStore ).getEntityRecord( 'root', 'site' ) ).toHaveProperty(
				'cookie_consent_template',
				currentTemplate
			);
		}
	);

	it.each( [
		[ 'wp_template', false ],
		[ 'wp_template', true ],
		[ 'wp_template_part', false ],
		[ 'wp_template_part', true ],
	] )(
		'syncs a banner converted to a new template part when its source is saved (%s, edited: %s)',
		async ( name, edited ) => {
			const originalBanner = serialize( [ createBlock( TYPE, { text: 'Saved banner' } ) ] );
			const oldReference = '<!-- wp:template-part {"slug":"old-part","theme":"theme"} /-->';
			const { core, save, savedBanner, settings } = setup( {
				postType: name,
				content: originalBanner + oldReference,
				templateParts: [
					{
						id: 'theme//old-part',
						content: { raw: originalBanner.replaceAll( 'Saved banner', 'Old banner' ) },
					},
				],
			} );
			const movedBanner = edited
				? savedBanner.replaceAll( 'Saved banner', 'New banner' )
				: savedBanner;
			let part;
			await act( async () => {
				part = await core.saveEntityRecord( 'postType', 'wp_template_part', {
					content: movedBanner,
				} );
				await new Promise( resolve => setTimeout( resolve, 0 ) );
			} );

			expect( settings.cookie_consent_template ).toBe( savedBanner );
			expect( settingsWrites() ).toEqual( [] );
			expect(
				apiFetch.mock.calls.filter(
					( [ { path, method } ] ) =>
						path.startsWith( '/wp/v2/wp_template_part' ) && ( ! method || method === 'GET' )
				)
			).toEqual( [] );

			const attributes = {
				slug: part.slug,
				...( name === 'wp_template' ? { theme: part.theme } : {} ),
			};
			await save(
				name,
				`${ oldReference }<!-- wp:group --><div><!-- wp:template-part ${ JSON.stringify(
					attributes
				) } /--></div><!-- /wp:group -->`
			);

			await waitFor( () => expect( settings.cookie_consent_template ).toBe( movedBanner ) );
			await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
			expect( settingsWrites()[ 0 ][ 0 ].data.cookie_consent_template ).toBe( movedBanner );
			expect(
				settingsWrites().some( ( [ { data } ] ) => data.cookie_consent_template === null )
			).toBe( false );
		}
	);

	it( 'finishes the previous settings write before starting the next one', async () => {
		const { save, savedBanner } = setup();
		const fetch = apiFetch.getMockImplementation();
		let finishWrite;
		apiFetch.mockImplementation( async options => {
			if ( options.path === '/wp/v2/settings' && options.method === 'POST' ) {
				await new Promise( resolve => {
					finishWrite = resolve;
				} );
			}
			return fetch( options );
		} );
		await save( 'wp_template', savedBanner.replaceAll( 'Saved banner', 'First banner' ) );
		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		await save( 'wp_template', savedBanner.replaceAll( 'Saved banner', 'Latest banner' ) );
		expect( settingsWrites() ).toHaveLength( 1 );
		await act( async () => finishWrite() );
		await waitFor( () => expect( settingsWrites() ).toHaveLength( 2 ) );
		await act( async () => finishWrite() );
		expect( settingsWrites()[ 1 ][ 0 ].data.cookie_consent_template ).toContain( 'Latest banner' );
	} );

	it( 'saves only the banner and leaves unrelated site edits and undo history alone', async () => {
		const { core, registry, save, savedBanner } = setup();
		await act( () =>
			core.editEntityRecord( 'root', 'site', undefined, { title: 'Unselected title' } )
		);

		await save( 'wp_template', savedBanner.replaceAll( 'Saved banner', 'Updated banner' ) );

		await waitFor( () => expect( settingsWrites() ).toHaveLength( 1 ) );
		expect( Object.keys( settingsWrites()[ 0 ][ 0 ].data ) ).toEqual( [
			'cookie_consent_template',
		] );
		expect( registry.select( coreStore ).getEntityRecord( 'root', 'site' ).title ).toBe(
			'Saved title'
		);
		expect( registry.select( coreStore ).getEntityRecordEdits( 'root', 'site' ) ).toEqual( {
			title: 'Unselected title',
		} );
		await act( () => core.undo() );
		expect(
			registry.select( coreStore ).getEntityRecordEdits( 'root', 'site' )
		).not.toHaveProperty( 'cookie_consent_template' );
	} );
} );
