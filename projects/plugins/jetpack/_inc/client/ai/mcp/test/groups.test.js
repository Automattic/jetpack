import { OPT_IN_GROUP_NAME, groupToolsByGroup } from '../groups';

const DESCRIPTORS = [ { name: 'site', label: 'Site', description: 'Site tools.', order: 1 } ];

describe( 'groupToolsByGroup', () => {
	test( 'moves opt-in tools out of their API group into a last section', () => {
		const groups = groupToolsByGroup(
			[
				[ 'secret', { group: 'site', requires_opt_in: true } ],
				[ 'list', { group: 'site' } ],
				[ 'loose', {} ],
			],
			DESCRIPTORS
		);

		expect(
			groups.map( ( { group, tools } ) => [ group?.name, tools.map( t => t[ 0 ] ) ] )
		).toEqual( [
			[ 'site', [ 'list' ] ],
			[ undefined, [ 'loose' ] ],
			[ OPT_IN_GROUP_NAME, [ 'secret' ] ],
		] );
	} );

	test( 'adds no opt-in section when nothing requires opt-in', () => {
		const groups = groupToolsByGroup(
			[ [ 'list', { group: 'site', requires_opt_in: false } ] ],
			DESCRIPTORS
		);

		expect( groups.map( ( { group } ) => group?.name ) ).toEqual( [ 'site' ] );
	} );
} );
