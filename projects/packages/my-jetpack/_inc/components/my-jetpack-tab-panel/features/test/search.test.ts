/**
 * @jest-environment node
 */
import { compareModulesByName, hasSearch, moduleFields, rankBy, searchTerms } from '../search';
import type { MyJetpackModule } from '../../../../types';

/**
 * Build a minimal module fixture.
 *
 * @param {object} fields                  - Partial module fields.
 * @param          fields.module           - The module slug.
 * @param          fields.name             - The module name.
 * @param          fields.description      - The short description.
 * @param          fields.long_description - The long description.
 * @param          fields.search_terms     - The curated search terms.
 * @return A MyJetpackModule suitable for the ranking helpers.
 */
function makeModule( fields: {
	module: string;
	name: string;
	description?: string;
	long_description?: string;
	search_terms?: string;
} ): MyJetpackModule {
	return {
		module: fields.module,
		name: fields.name,
		description: fields.description ?? '',
		long_description: fields.long_description ?? '',
		search_terms: fields.search_terms ?? '',
		available: true,
		activated: false,
	};
}

/**
 * Rank modules against a query the way the Features tab does.
 *
 * @param {Array<MyJetpackModule>} modules - The modules to rank.
 * @param {string}                 search  - The query.
 * @return The matching module slugs, best match first.
 */
function rank( modules: Array< MyJetpackModule >, search: string ) {
	return rankBy( modules, searchTerms( search ), moduleFields ).map( ( { item } ) => item.module );
}

const forms = makeModule( {
	module: 'contact-form',
	name: 'Forms',
	description: 'Add contact, registration, and feedback forms directly from the block editor.',
} );
const akismet = makeModule( {
	module: 'akismet',
	name: 'Akismet Anti-spam',
	description: 'Automatically clear spam from comments and forms.',
} );
const stats = makeModule( {
	module: 'stats',
	name: 'Stats',
	description: 'Clear, concise, and actionable analysis of your site performance.',
} );

describe( 'hasSearch', () => {
	it( 'ignores an empty or whitespace-only query', () => {
		expect( hasSearch( undefined ) ).toBe( false );
		expect( hasSearch( '   ' ) ).toBe( false );
		expect( hasSearch( 'forms' ) ).toBe( true );
	} );
} );

describe( 'rankBy with moduleFields', () => {
	it( 'ranks a name match above a description-only match', () => {
		expect( rank( [ akismet, forms ], 'forms' ) ).toEqual( [ 'contact-form', 'akismet' ] );
	} );

	it( 'does not surface unrelated modules via fuzzy description matches', () => {
		expect( rank( [ stats ], 'forms' ) ).toEqual( [] );
	} );

	it( 'requires every word of the query to match (AND semantics)', () => {
		expect( rank( [ akismet, forms ], 'forms spam' ) ).toEqual( [ 'akismet' ] );
	} );

	it( 'is case-insensitive', () => {
		expect( rank( [ akismet, forms ], 'FORMS' ) ).toEqual( rank( [ akismet, forms ], 'forms' ) );
	} );

	it( 'does not match on the slug', () => {
		expect( rank( [ forms ], 'contact-form' ) ).toEqual( [] );
	} );

	it( 'treats regular expression characters in the query literally', () => {
		expect( () => rank( [ forms ], 'forms (' ) ).not.toThrow();
		expect( rank( [ forms ], 'forms (' ) ).toEqual( [] );
	} );

	it( 'matches a module via its curated search terms', () => {
		const newsletter = makeModule( {
			module: 'subscriptions',
			name: 'Newsletter',
			description: 'Grow your subscriber list and deliver your content to their inbox.',
			search_terms: 'subscriptions, subscribers, email',
		} );

		expect( rank( [ newsletter ], 'subscribers' ) ).toEqual( [ 'subscriptions' ] );
	} );
} );

describe( 'compareModulesByName', () => {
	it( 'sorts modules by name', () => {
		const result = [
			makeModule( { module: 'sso', name: 'Secure Sign On' } ),
			makeModule( { module: 'monitor', name: 'Downtime Monitoring' } ),
		].sort( compareModulesByName );

		expect( result.map( m => m.module ) ).toEqual( [ 'monitor', 'sso' ] );
	} );

	// Only a null *receiver* throws, so the crash depends on where the module lands in the array.
	it( 'sorts a module whose name failed to translate by its slug (regression: null-name crash)', () => {
		const untranslated = {
			...makeModule( { module: 'activity-log', name: '' } ),
			name: null,
		} as unknown as MyJetpackModule;

		const result = [
			makeModule( { module: 'monitor', name: 'Downtime Monitoring' } ),
			untranslated,
			makeModule( { module: 'account-protection', name: 'Account Protection' } ),
		].sort( compareModulesByName );

		expect( result.map( m => m.module ) ).toEqual( [
			'account-protection',
			'activity-log',
			'monitor',
		] );
	} );
} );
