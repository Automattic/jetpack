/**
 * Internal dependencies
 */
import { getFields } from './stats-settings-fields';

const ROLES = [
	{ slug: 'administrator', name: 'Administrator', count: 2 },
	{ slug: 'editor', name: 'Editor', count: 3 },
];

describe( 'getFields', () => {
	const rolesField = getFields( ROLES ).find( field => field.id === 'roles' );

	it( 'keeps administrators able to view stats when the last other role is removed', () => {
		expect( rolesField?.setValue?.( { item: {} as never, value: [] } ) ).toEqual( {
			roles: [ 'administrator' ],
		} );
	} );

	it( 'labels a role with only its name when the site sends no user count', () => {
		const countRoles = getFields( [ { slug: 'editor', name: 'Editor', count: null } ] ).find(
			field => field.id === 'count_roles'
		);

		expect( countRoles?.elements?.[ 0 ]?.label ).toBe( 'Editor' );
	} );

	it( 'leaves administrators out of the viewer choices, since they cannot be removed', () => {
		expect( rolesField?.elements?.map( element => element.value ) ).toEqual( [ 'editor' ] );
		expect(
			rolesField?.getValue?.( {
				item: { roles: [ 'administrator', 'editor' ] } as never,
			} )
		).toEqual( [ 'editor' ] );
	} );
} );
