import { describe, expect, test } from '@jest/globals';
import { ALL_AI_AGENTS_ACTOR_ID } from '../actor-elements';
import { actorToFilter, getPresetFilters } from '../filters';

const PAGE = 'https://example.com/wp-admin/admin.php?page=jetpack-activity-log';
const AI_FILTER = { field: 'actor', operator: 'isAny', value: [ ALL_AI_AGENTS_ACTOR_ID ] };

describe( 'actorToFilter', () => {
	test( 'maps "mcp:*" to the actor filter DataViews writes', () => {
		expect( actorToFilter( 'mcp:*' ) ).toEqual( AI_FILTER );
	} );

	test.each( [ 'mcp:anthropicclaudeai', 'wpcom:1', '', undefined, [ 'mcp:*' ] ] )(
		'ignores %p',
		value => {
			expect( actorToFilter( value ) ).toBeNull();
		}
	);
} );

describe( 'getPresetFilters', () => {
	test( 'decodes the encoded value the AI Hub sends', () => {
		expect( getPresetFilters( `${ PAGE }&actor=mcp%3A%2A`, true ) ).toEqual( [ AI_FILTER ] );
	} );

	test( 'accepts the unencoded value', () => {
		expect( getPresetFilters( `${ PAGE }&actor=mcp:*`, true ) ).toEqual( [ AI_FILTER ] );
	} );

	test( 'ignores the value on sites without paid Activity Log access', () => {
		expect( getPresetFilters( `${ PAGE }&actor=mcp%3A%2A`, false ) ).toEqual( [] );
	} );

	test( 'ignores the array form', () => {
		expect( getPresetFilters( `${ PAGE }&actor[]=mcp%3A%2A`, true ) ).toEqual( [] );
	} );

	test( 'returns nothing without an actor parameter', () => {
		expect( getPresetFilters( PAGE, true ) ).toEqual( [] );
	} );
} );
