import { reorderAdminMenuItems } from '../content';

const makeMenuItem = ( id: string, order: number, overrides = {} ) => ( {
	id,
	label: id,
	menuSlug: id,
	group: 'create',
	groupLabel: 'Create',
	order,
	customizable: true,
	hidden: false,
	external: false,
	...overrides,
} );

describe( 'reorderAdminMenuItems', () => {
	it( 'reorders items from a sorted list of ids while preserving item settings', () => {
		const items = [
			makeMenuItem( 'stats', 10, { group: 'top' } ),
			makeMenuItem( 'forms', 20, { hidden: true } ),
			makeMenuItem( 'backup', 30, { customizable: false } ),
		];

		const result = reorderAdminMenuItems( items, [ 'forms', 'stats', 'backup' ] );

		expect( result.map( item => item.id ) ).toEqual( [ 'forms', 'stats', 'backup' ] );
		expect( result.map( item => item.order ) ).toEqual( [ 0, 10, 20 ] );
		expect( result[ 0 ].hidden ).toBe( true );
		expect( result[ 1 ].group ).toBe( 'top' );
		expect( result[ 2 ].customizable ).toBe( false );
	} );

	it( 'keeps omitted items at the end in their current order', () => {
		const items = [
			makeMenuItem( 'stats', 10 ),
			makeMenuItem( 'forms', 20 ),
			makeMenuItem( 'backup', 30 ),
		];

		const result = reorderAdminMenuItems( items, [ 'backup' ] );

		expect( result.map( item => item.id ) ).toEqual( [ 'backup', 'stats', 'forms' ] );
		expect( result.map( item => item.order ) ).toEqual( [ 0, 10, 20 ] );
	} );
} );
