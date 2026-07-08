import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { SettingsResponse } from '../settings-types';

// True-ESM Jest (`--experimental-vm-modules`): register mocks with
// `jest.unstable_mockModule`, then import the hook dynamically. `@wordpress/element`
// stays real so the hook's state/refs behave; only the data/REST edges are stubbed.
const mockApiFetch = jest.fn< ( options: unknown ) => Promise< unknown > >();
const createInfoNotice = jest.fn();
const createSuccessNotice = jest.fn();
const createErrorNotice = jest.fn();
const setSettings = jest.fn();

const SEED: SettingsResponse = {
	front_page_description: 'Old description.',
	title_formats: { posts: [ { type: 'token', value: 'site_name' } ] },
	verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
	search_engines_visible: true,
	sitemap_active: false,
	sitemap_url: '',
	canonical_active: false,
	schema: {
		organization: { name: '', description: '', sameAs: [], email: '' },
		defaults: { organization: { name: 'Acme Co', description: 'We make things' } },
	},
};

const SETTINGS_STORE = 'seo/settings';

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );
jest.unstable_mockModule( '../settings-store', () => ( { settingsStore: SETTINGS_STORE } ) );
jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: ( store: string ) => ( store === SETTINGS_STORE ? { getSettings: () => SEED } : {} ),
	useDispatch: ( store: string ) =>
		store === SETTINGS_STORE
			? { setSettings }
			: { createInfoNotice, createSuccessNotice, createErrorNotice },
} ) );

const { useSettingsForm } = await import( '../use-settings' );

describe( 'useSettingsForm', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( {} );
	} );

	it( 'reports a section dirty only once its field diverges from the baseline', () => {
		const { result } = renderHook( () => useSettingsForm() );

		expect( result.current.isDirty( [ 'front_page_description' ] ) ).toBe( false );

		act( () => result.current.setField( { front_page_description: 'New description.' } ) );

		expect( result.current.isDirty( [ 'front_page_description' ] ) ).toBe( true );
		// An untouched section stays clean.
		expect( result.current.isDirty( [ 'title_formats' ] ) ).toBe( false );
	} );

	it( 'commitFields saves only the named section, leaving other edits pending', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// Edit both text sections locally...
		act( () => {
			result.current.setField( { front_page_description: 'New description.' } );
			result.current.setField( {
				title_formats: { posts: [ { type: 'string', value: 'Hello' } ] },
			} );
		} );

		// ...but save only the front-page description.
		act( () => result.current.commitFields( [ 'front_page_description' ] ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			path: string;
			data: Record< string, unknown >;
		};
		expect( call.path ).toBe( '/jetpack/v4/settings' );
		expect( call.data ).toHaveProperty( 'advanced_seo_front_page_description' );
		// The title-structure edit was NOT part of this section's save.
		expect( call.data ).not.toHaveProperty( 'advanced_seo_title_formats' );

		// Once the save settles the front-page section is clean (baseline updates
		// asynchronously), and the untouched title-structure edit stayed pending.
		await waitFor( () =>
			expect( result.current.isDirty( [ 'front_page_description' ] ) ).toBe( false )
		);
		expect( result.current.isTitleFormatDirty( 'posts' ) ).toBe( true );
	} );

	it( 'commit (toggle save) persists only the toggled field, not pending text edits', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// Unsaved edit in a text-heavy section...
		act( () => result.current.setField( { front_page_description: 'New description.' } ) );

		// ...then flip a toggle, which saves immediately.
		act( () => result.current.commit( { canonical_active: true } ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as { data: Record< string, unknown > };
		expect( call.data ).toHaveProperty( 'canonical-urls', true );
		// The unsaved front-page edit must NOT be dragged into the toggle's save.
		expect( call.data ).not.toHaveProperty( 'advanced_seo_front_page_description' );
		// It stays pending until its own Save.
		expect( result.current.isDirty( [ 'front_page_description' ] ) ).toBe( true );
	} );

	it( 'commitTitleFormat saves only that page type, leaving other rows pending', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// Edit two page types' title formats locally.
		act( () =>
			result.current.setField( {
				title_formats: {
					posts: [ { type: 'string', value: 'Hello' } ],
					pages: [ { type: 'token', value: 'site_name' } ],
				},
			} )
		);

		expect( result.current.isTitleFormatDirty( 'posts' ) ).toBe( true );
		expect( result.current.isTitleFormatDirty( 'pages' ) ).toBe( true );

		// Save only the Posts row.
		act( () => result.current.commitTitleFormat( 'posts' ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as { data: Record< string, unknown > };
		const saved = call.data.advanced_seo_title_formats as Record< string, unknown >;
		expect( saved.posts ).toEqual( [ { type: 'string', value: 'Hello' } ] );
		// The Pages edit was not persisted in this row's save.
		expect( saved ).not.toHaveProperty( 'pages' );

		// Posts is now clean; Pages is still pending.
		await waitFor( () => expect( result.current.isTitleFormatDirty( 'posts' ) ).toBe( false ) );
		expect( result.current.isTitleFormatDirty( 'pages' ) ).toBe( true );
	} );

	it( 'per-section saves are no-ops when nothing changed', () => {
		const { result } = renderHook( () => useSettingsForm() );

		act( () => result.current.commitFields( [ 'front_page_description' ] ) );
		act( () => result.current.commitTitleFormat( 'posts' ) );

		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'updates the saved settings snapshot when schema saves separately', () => {
		const { result } = renderHook( () => useSettingsForm() );
		const schema = {
			...SEED.schema,
			organization: {
				...SEED.schema.organization,
				sameAs: [ 'https://example.com/acme' ],
			},
		};

		act( () => result.current.setField( { front_page_description: 'Unsaved description.' } ) );
		act( () => result.current.setSchemaSettings( schema ) );

		expect( result.current.local?.schema ).toEqual( schema );
		expect( result.current.local?.front_page_description ).toBe( 'Unsaved description.' );
		expect( setSettings ).toHaveBeenCalledWith( { ...SEED, schema } );
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
