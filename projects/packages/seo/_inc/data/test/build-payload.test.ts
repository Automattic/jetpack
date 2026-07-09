/**
 * @jest-environment node
 */
import { buildCorePayload, buildJetpackPayload } from '../build-payload';
import type { SettingsResponse } from '../settings-types';

const makeSettings = ( overrides: Partial< SettingsResponse > = {} ): SettingsResponse => ( {
	front_page_description: '',
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
	...overrides,
} );

describe( 'buildJetpackPayload', () => {
	it( 'returns an empty payload when nothing changed', () => {
		const baseline = makeSettings();
		expect( buildJetpackPayload( baseline, makeSettings() ) ).toEqual( {} );
	} );

	it( 'includes only the sitemaps key when the sitemap toggle changed', () => {
		const baseline = makeSettings( { sitemap_active: false } );
		const local = makeSettings( { sitemap_active: true } );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( { sitemaps: true } );
	} );

	it( 'includes only the canonical-urls key when the canonical toggle changed', () => {
		const baseline = makeSettings( { canonical_active: false } );
		const local = makeSettings( { canonical_active: true } );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( { 'canonical-urls': true } );
	} );

	it( 'maps a front-page description change to advanced_seo_front_page_description', () => {
		const baseline = makeSettings( { front_page_description: '' } );
		const local = makeSettings( { front_page_description: 'Hello.' } );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {
			advanced_seo_front_page_description: 'Hello.',
		} );
	} );

	it( 'maps a title-format change to advanced_seo_title_formats', () => {
		const baseline = makeSettings( { title_formats: { posts: [] } } );
		const local = makeSettings( {
			title_formats: { posts: [ { type: 'token', value: 'post_title' } ] },
		} );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {
			advanced_seo_title_formats: { posts: [ { type: 'token', value: 'post_title' } ] },
		} );
	} );

	it( 'does not emit title_formats when the array is deeply equal', () => {
		const formats = { posts: [ { type: 'token' as const, value: 'site_name' } ] };
		const baseline = makeSettings( { title_formats: formats } );
		// A different object reference with identical contents must not be a diff.
		const local = makeSettings( {
			title_formats: { posts: [ { type: 'token', value: 'site_name' } ] },
		} );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {} );
	} );

	it( 'includes only the changed verification keys', () => {
		const baseline = makeSettings();
		const local = makeSettings( {
			verification: { google: 'g-code', bing: '', pinterest: '', yandex: 'y-code', facebook: '' },
		} );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {
			google: 'g-code',
			yandex: 'y-code',
		} );
	} );

	it( 'combines every changed Jetpack field in one payload', () => {
		const baseline = makeSettings();
		const local = makeSettings( {
			sitemap_active: true,
			front_page_description: 'Desc',
			verification: { google: 'g', bing: '', pinterest: '', yandex: '', facebook: '' },
		} );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {
			sitemaps: true,
			advanced_seo_front_page_description: 'Desc',
			google: 'g',
		} );
	} );

	it( 'ignores search-engine visibility (that is a core option)', () => {
		const baseline = makeSettings( { search_engines_visible: true } );
		const local = makeSettings( { search_engines_visible: false } );
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {} );
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
		expect( buildJetpackPayload( baseline, local ) ).toEqual( {} );
	} );
} );

describe( 'buildCorePayload', () => {
	it( 'returns an empty payload when visibility is unchanged', () => {
		const baseline = makeSettings( { search_engines_visible: true } );
		expect(
			buildCorePayload( baseline, makeSettings( { search_engines_visible: true } ) )
		).toEqual( {} );
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

	it( 'ignores Jetpack-only fields', () => {
		const baseline = makeSettings();
		const local = makeSettings( { sitemap_active: true, front_page_description: 'x' } );
		expect( buildCorePayload( baseline, local ) ).toEqual( {} );
	} );
} );
