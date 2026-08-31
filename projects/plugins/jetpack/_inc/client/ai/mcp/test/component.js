import {
	DISPLAY_CATEGORIES,
	getDisplayCategory,
	getSubCategory,
	isWriteTool,
	sortTools,
} from '../categories';
import { getOverridesToMatch, groupIntentKey } from '../group-intents';
import { groupToolsByGroup, groupToolsBySubCategory } from '../groups';

describe( 'MCP category mapping', () => {
	test.each( [ 'wpcom-mcp', 'developer-testing' ] )(
		'maps %s API category to Developer & testing',
		category => {
			expect( getDisplayCategory( 'tool-id', { category } ) ).toBe(
				DISPLAY_CATEGORIES.DEVELOPER_TESTING
			);
		}
	);

	test.each( [ 'jetpack', 'wpcom' ] )(
		'does not map the entire %s API category to Developer & testing',
		category => {
			expect( getDisplayCategory( 'tool-id', { category } ) ).toBe(
				DISPLAY_CATEGORIES.UNCATEGORIZED
			);
		}
	);

	test.each( [
		'jetpack/search-voice',
		'jetpack-search-voice',
		'wpcom-mcp/jetpack-search-voice',
		'wpcom-mcp-jetpack-search-voice',
	] )( 'maps %s tool ID to Developer & testing', toolId => {
		expect( getDisplayCategory( toolId, { category: 'posts' } ) ).toBe(
			DISPLAY_CATEGORIES.DEVELOPER_TESTING
		);
	} );

	test( 'maps search voice ability names to Developer & testing', () => {
		expect(
			getDisplayCategory( 'tool-id', {
				category: 'posts',
				name: 'wpcom-mcp/jetpack-search-voice',
			} )
		).toBe( DISPLAY_CATEGORIES.DEVELOPER_TESTING );
	} );

	test( 'maps known API categories to their display category', () => {
		expect( getDisplayCategory( 'tool-id', { category: 'posts' } ) ).toBe(
			DISPLAY_CATEGORIES.POSTS
		);
		expect( getDisplayCategory( 'tool-id', { category: 'domains' } ) ).toBe(
			DISPLAY_CATEGORIES.DOMAINS
		);
	} );

	test( 'falls back to Uncategorized when no mapped category is available', () => {
		expect( getDisplayCategory( 'tool-id', { category: 'unknown' } ) ).toBe(
			DISPLAY_CATEGORIES.UNCATEGORIZED
		);
		expect( getDisplayCategory( 'tool-id' ) ).toBe( DISPLAY_CATEGORIES.UNCATEGORIZED );
	} );

	test( 'returns the matching sub-category for known API categories', () => {
		expect( getSubCategory( 'tool-id', { category: 'comments' } ) ).toBe( 'Comments' );
		expect( getSubCategory( 'tool-id', { category: 'site-settings' } ) ).toBe( 'Site settings' );
	} );

	test( 'returns undefined when no sub-category is available', () => {
		expect( getSubCategory( 'tool-id', { category: 'domains' } ) ).toBeUndefined();
		expect( getSubCategory( 'tool-id' ) ).toBeUndefined();
	} );

	test( 'identifies write tools by readonly flag', () => {
		expect( isWriteTool( 'tool-id', { readonly: false } ) ).toBe( true );
		expect( isWriteTool( 'tool-id', { readonly: true } ) ).toBe( false );
		expect( isWriteTool( 'tool-id' ) ).toBe( false );
	} );

	test( 'prefers top-level readonly over annotations.readonly', () => {
		expect( isWriteTool( 'tool-id', { readonly: false, annotations: { readonly: true } } ) ).toBe(
			true
		);
		expect( isWriteTool( 'tool-id', { readonly: true, annotations: { readonly: false } } ) ).toBe(
			false
		);
	} );

	test( 'leaves tool order unchanged', () => {
		const tools = [
			[ 'first', {} ],
			[ 'second', {} ],
		];

		expect( sortTools( tools ) ).toBe( tools );
	} );
} );

const GROUPS = [
	{
		name: 'content-authoring',
		label: 'Content Authoring',
		description: 'Create posts.',
		order: 0,
	},
	{ name: 'site', label: 'Site', description: 'Manage site settings.', order: 1 },
	{ name: 'account', label: 'Account', description: 'Manage account settings.', order: 2 },
];

describe( 'MCP group-intents', () => {
	test( 'groupIntentKey builds a read/write-scoped compound key', () => {
		expect( groupIntentKey( 'write', 'site' ) ).toBe( 'write:site' );
		expect( groupIntentKey( 'read', 'account' ) ).toBe( 'read:account' );
	} );

	test( 'getOverridesToMatch returns overrides only for disagreeing tools', () => {
		const tools = [
			[ 'wpcom-mcp/already-on', { enabled: true } ],
			[ 'wpcom-mcp/needs-on', { enabled: false } ],
		];
		expect( getOverridesToMatch( tools, true ) ).toEqual( { 'wpcom-mcp/needs-on': true } );
	} );

	test( 'getOverridesToMatch returns undefined when every tool matches', () => {
		expect( getOverridesToMatch( [ [ 'wpcom-mcp/a', { enabled: true } ] ], true ) ).toBeUndefined();
	} );

	test( 'getOverridesToMatch returns undefined for an empty list', () => {
		expect( getOverridesToMatch( [], true ) ).toBeUndefined();
	} );
} );

describe( 'MCP groups', () => {
	test( 'groupToolsByGroup orders groups by descriptor order', () => {
		const tools = [
			[ 'wpcom-mcp/posts-create', { group: 'content-authoring' } ],
			[ 'wpcom-mcp/site-settings-update', { group: 'site' } ],
		];
		const groups = groupToolsByGroup( tools, GROUPS );
		expect( groups.map( g => g.group?.name ) ).toEqual( [ 'content-authoring', 'site' ] );
	} );

	test( 'groupToolsByGroup buckets ungrouped tools into trailing "Other"', () => {
		const tools = [
			[ 'wpcom-mcp/standalone', { group: null } ],
			[ 'wpcom-mcp/posts-create', { group: 'content-authoring' } ],
		];
		const groups = groupToolsByGroup( tools, GROUPS );
		expect( groups ).toHaveLength( 2 );
		expect( groups[ groups.length - 1 ].group ).toBeNull();
	} );

	test( 'groupToolsBySubCategory places no-category tools in trailing null bucket', () => {
		const tools = [ [ 'wpcom-mcp/unknown', {} ] ];
		const result = groupToolsBySubCategory( tools );
		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].subCategory ).toBeNull();
	} );

	test( 'groupToolsBySubCategory orders posts before comments', () => {
		const tools = [
			[ 'wpcom-mcp/list-comments', { category: 'comments' } ],
			[ 'wpcom-mcp/list-posts', { category: 'posts' } ],
		];
		const result = groupToolsBySubCategory( tools );
		expect( result[ 0 ].tools[ 0 ][ 0 ] ).toBe( 'wpcom-mcp/list-posts' );
	} );
} );
