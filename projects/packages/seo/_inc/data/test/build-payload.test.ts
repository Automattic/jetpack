/**
 * @jest-environment node
 */
import { buildCorePayload, buildModulesPayload } from '../build-payload';
import { makeSchemaSettings } from './fixtures/schema-settings-fixtures';
import type { SettingsResponse } from '../settings-types';

const makeSettings = ( overrides: Partial< SettingsResponse > = {} ): SettingsResponse => ( {
	front_page_description: '',
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
	...overrides,
} );

describe( 'buildCorePayload', () => {
	it( 'returns an empty payload when nothing changed', () => {
		const baseline = makeSettings();
		expect( buildCorePayload( baseline, makeSettings() ) ).toEqual( {} );
	} );

	it( 'maps allow-indexing to blog_public = 1', () => {
		const baseline = makeSettings( { search_engines_visible: false } );
		const local = makeSettings( { search_engines_visible: true } );
		expect( buildCorePayload( baseline, local ) ).toEqual( { blog_public: 1 } );
	} );

	it( 'maps discourage-indexing to blog_public = 0', () => {
		const baseline = makeSettings( { search_engines_visible: true } );
		const local = makeSettings( { search_engines_visible: false } );
		expect( buildCorePayload( baseline, local ) ).toEqual( { blog_public: 0 } );
	} );

	it( 'maps the sitemap toggle to the durable sitemap setting', () => {
		const baseline = makeSettings( { sitemap_active: false } );
		const local = makeSettings( { sitemap_active: true } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			jetpack_seo_sitemap_enabled: true,
		} );
	} );

	it( 'maps the canonical toggle to the durable canonical setting', () => {
		const baseline = makeSettings( { canonical_active: false } );
		const local = makeSettings( { canonical_active: true } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			jetpack_seo_canonical_urls_enabled: true,
		} );
	} );

	it( 'maps a front-page description change to advanced_seo_front_page_description', () => {
		const baseline = makeSettings( { front_page_description: '' } );
		const local = makeSettings( { front_page_description: 'Hello.' } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			advanced_seo_front_page_description: 'Hello.',
		} );
	} );

	it( 'maps a title-format change to advanced_seo_title_formats', () => {
		const baseline = makeSettings( { title_formats: { posts: [] } } );
		const local = makeSettings( {
			title_formats: { posts: [ { type: 'token', value: 'post_title' } ] },
		} );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			advanced_seo_title_formats: { posts: [ { type: 'token', value: 'post_title' } ] },
		} );
	} );

	it( 'never emits title formats from a read-only conflict state', () => {
		const baseline = makeSettings( {
			title_formats: { posts: [ { type: 'token', value: 'site_name' } ] },
			title_formats_editable: false,
		} );
		const local = makeSettings( {
			title_formats: { posts: [] },
			title_formats_editable: false,
		} );

		expect( buildCorePayload( baseline, local ) ).toEqual( {} );
	} );

	it( 'does not emit title_formats when the array is deeply equal', () => {
		const formats = { posts: [ { type: 'token' as const, value: 'site_name' } ] };
		const baseline = makeSettings( { title_formats: formats } );
		// A different object reference with identical contents must not be a diff.
		const local = makeSettings( {
			title_formats: { posts: [ { type: 'token', value: 'site_name' } ] },
		} );
		expect( buildCorePayload( baseline, local ) ).toEqual( {} );
	} );

	it( 'sends the whole verification map when any code changed', () => {
		const baseline = makeSettings();
		const verification = {
			google: 'g-code',
			bing: '',
			pinterest: '',
			yandex: 'y-code',
			facebook: '',
		};
		const local = makeSettings( { verification } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			verification_services_codes: verification,
		} );
	} );

	it( 'combines every changed field in one payload', () => {
		const baseline = makeSettings();
		const verification = { google: 'g', bing: '', pinterest: '', yandex: '', facebook: '' };
		const local = makeSettings( {
			sitemap_active: true,
			front_page_description: 'Desc',
			verification,
		} );
		expect( buildCorePayload( baseline, local ) ).toEqual( {
			jetpack_seo_sitemap_enabled: true,
			advanced_seo_front_page_description: 'Desc',
			verification_services_codes: verification,
		} );
	} );

	it( 'ignores the verification module toggle (that is not an option)', () => {
		const baseline = makeSettings( { verification_tools_active: true } );
		const local = makeSettings( { verification_tools_active: false } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {} );
	} );

	it( 'ignores schema settings (they use the schema route)', () => {
		const baseline = makeSettings();
		const local = makeSettings( {
			schema: {
				...baseline.schema,
				organization: {
					...baseline.schema.organization,
					sameAs: [ 'https://example.com/acme' ],
				},
			},
		} );
		expect( buildCorePayload( baseline, local ) ).toEqual( {} );
	} );
} );

describe( 'buildModulesPayload', () => {
	it( 'returns an empty payload when the module toggle is unchanged', () => {
		const baseline = makeSettings( { verification_tools_active: true } );
		expect(
			buildModulesPayload( baseline, makeSettings( { verification_tools_active: true } ) )
		).toEqual( {} );
	} );

	it( 'emits the verification module state when it changed', () => {
		const baseline = makeSettings( { verification_tools_active: true } );
		const local = makeSettings( { verification_tools_active: false } );
		expect( buildModulesPayload( baseline, local ) ).toEqual( {
			verification_tools_active: false,
		} );
	} );

	it( 'ignores option-backed fields', () => {
		const baseline = makeSettings();
		const local = makeSettings( { sitemap_active: true, front_page_description: 'x' } );
		expect( buildModulesPayload( baseline, local ) ).toEqual( {} );
	} );
} );
