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

		// ...but save only the title structure.
		act( () => result.current.commitFields( [ 'title_formats' ] ) );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
		const call = mockApiFetch.mock.calls[ 0 ][ 0 ] as {
			path: string;
			data: Record< string, unknown >;
		};
		expect( call.path ).toBe( '/jetpack/v4/settings' );
		expect( call.data ).toHaveProperty( 'advanced_seo_title_formats' );
		// The front-page edit was NOT part of this section's save.
		expect( call.data ).not.toHaveProperty( 'advanced_seo_front_page_description' );

		// The front-page section is still pending.
		await waitFor( () =>
			expect( result.current.isDirty( [ 'front_page_description' ] ) ).toBe( true )
		);
		// The saved section is now clean.
		expect( result.current.isDirty( [ 'title_formats' ] ) ).toBe( false );
	} );

	it( 'commitFields is a no-op when the section is unchanged', () => {
		const { result } = renderHook( () => useSettingsForm() );

		act( () => result.current.commitFields( [ 'front_page_description' ] ) );

		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );
} );
