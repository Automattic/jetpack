import { jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { makeSchemaSettings } from './fixtures/schema-settings-fixtures';
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
	has_legacy_front_page_meta: false,
	title_formats: { posts: [ { type: 'token', value: 'site_name' } ] },
	title_separator: '-',
	title_formats_editable: true,
	verification_tools_active: true,
	verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
	search_engines_visible: true,
	sitemap_active: false,
	sitemap_url: '',
	canonical_active: false,
	schema: makeSchemaSettings(),
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

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			path: string;
			data: Record< string, unknown >;
		};
		expect( call.path ).toBe( '/wp/v2/settings' );
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

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			path: string;
			data: Record< string, unknown >;
		};
		expect( call.path ).toBe( '/jetpack/v4/seo/modules' );
		expect( call.data ).toHaveProperty( 'canonical_active', true );
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

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );
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

	it( 'sends the settings and module writes one after the other, never at once', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// Resolve the settings write only when we say so, so an overlapping module
		// write would be observable. Both endpoints end up mutating Jetpack's shared
		// `active_modules` option, so overlapping writes can drop one another.
		let releaseSettings = () => {};
		mockApiFetch.mockImplementationOnce(
			() =>
				new Promise( resolve => {
					releaseSettings = () => resolve( {} );
				} )
		);

		act( () =>
			result.current.commit( {
				front_page_description: 'New description.',
				verification_tools_active: false,
			} )
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( ( mockApiFetch.mock.calls[ 0 ][ 0 ] as { path: string } ).path ).toBe(
			'/wp/v2/settings'
		);
		// The module write must still be waiting on the settings write.
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );

		act( () => releaseSettings() );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 3 ) );
		const paths = mockApiFetch.mock.calls.map(
			( [ options ] ) => ( options as { path: string } ).path
		);
		expect( paths ).toEqual( [
			'/wp/v2/settings',
			'/jetpack/v4/seo/modules',
			'/jetpack/v4/seo/settings',
		] );
	} );

	it( 'adopts the server state, so a value the server refused is not shown as saved', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// The module write reports success for something the server then shows
		// differently — whatever the reason, the form must follow the server.
		mockApiFetch.mockResolvedValueOnce( {} );
		mockApiFetch.mockResolvedValueOnce( { ...SEED, sitemap_active: false } );

		act( () => result.current.commit( { sitemap_active: true } ) );

		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( result.current.local?.sitemap_active ).toBe( false );
		// And it's the new baseline, so the section doesn't read as dirty either.
		expect( result.current.isDirty( [ 'sitemap_active' ] ) ).toBe( false );
	} );

	it( 'reconciles with the server when a save fails after its first request landed', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// Settings write lands, module write fails.
		mockApiFetch.mockResolvedValueOnce( {} );
		mockApiFetch.mockRejectedValueOnce( {
			message: 'The verification-tools module could not be switched.',
		} );
		mockApiFetch.mockResolvedValueOnce( {
			...SEED,
			front_page_description: 'New description.',
			verification_tools_active: true,
		} );

		act( () =>
			result.current.commit( {
				front_page_description: 'New description.',
				verification_tools_active: false,
			} )
		);

		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( createErrorNotice ).toHaveBeenCalled();
		// The part that did save is shown as saved; the part that didn't is not.
		expect( result.current.local?.front_page_description ).toBe( 'New description.' );
		expect( result.current.local?.verification_tools_active ).toBe( true );
	} );

	it( 'surfaces the error when a module-backed write is refused', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// The module route can say no — that's why these settings don't go through
		// core's settings endpoint, which answers 200 either way.
		mockApiFetch.mockRejectedValueOnce( {
			message: 'The sitemaps module could not be switched.',
		} );
		mockApiFetch.mockResolvedValueOnce( { ...SEED, sitemap_active: false } );

		act( () => result.current.commit( { sitemap_active: true } ) );

		await waitFor( () => expect( result.current.isSaving ).toBe( false ) );
		expect( createErrorNotice ).toHaveBeenCalledWith(
			'The sitemaps module could not be switched.',
			expect.anything()
		);
		expect( createSuccessNotice ).not.toHaveBeenCalled();
		// And the toggle shows the state the site is actually in.
		expect( result.current.local?.sitemap_active ).toBe( false );
	} );

	it( 'releases the controls even if the post-save read never comes back', async () => {
		jest.useFakeTimers();
		const { result } = renderHook( () => useSettingsForm() );

		mockApiFetch.mockResolvedValueOnce( {} );
		// A refresh that hangs forever must not leave every control disabled.
		mockApiFetch.mockImplementationOnce( () => new Promise( () => {} ) );

		act( () => result.current.commit( { sitemap_active: true } ) );

		await act( async () => {
			await Promise.resolve();
		} );
		expect( result.current.isSaving ).toBe( true );

		await act( async () => {
			jest.advanceTimersByTime( 10000 );
			await Promise.resolve();
		} );

		expect( result.current.isSaving ).toBe( false );
		jest.useRealTimers();
	} );

	it( 'refreshes the sitemap URL after toggling the sitemap on', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		// First call is the settings write; the second is the SEO-settings re-read
		// that surfaces the freshly-reachable sitemap_url.
		mockApiFetch.mockResolvedValueOnce( {} );
		mockApiFetch.mockResolvedValueOnce( {
			...SEED,
			sitemap_active: true,
			sitemap_url: 'https://example.com/sitemap.xml',
		} );

		act( () => result.current.commit( { sitemap_active: true } ) );

		await waitFor( () =>
			expect( result.current.local?.sitemap_url ).toBe( 'https://example.com/sitemap.xml' )
		);
		expect( result.current.local?.sitemap_active ).toBe( true );

		const paths = mockApiFetch.mock.calls.map(
			( [ options ] ) => ( options as { path: string } ).path
		);
		expect( paths ).toContain( '/jetpack/v4/seo/modules' );
		expect( paths ).toContain( '/jetpack/v4/seo/settings' );
	} );

	it( 'saves the verification module toggle through the package module route', async () => {
		const { result } = renderHook( () => useSettingsForm() );

		act( () => result.current.commit( { verification_tools_active: false } ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			path: string;
			data: Record< string, unknown >;
		};
		// Module activation is the one setting core's endpoint can't express.
		expect( call.path ).toBe( '/jetpack/v4/seo/modules' );
		expect( call.data ).toEqual( { verification_tools_active: false } );
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
