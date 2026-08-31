import { getMenuCatalogState, insertActivatedItem } from '../product-catalog';
import type { AdminMenuItem } from '../types';

const makeItem = (
	id: string,
	label: string,
	overrides: Partial< AdminMenuItem > = {}
): AdminMenuItem => ( {
	id,
	label,
	menuSlug: id,
	order: 0,
	hasSavedOrder: false,
	customizable: true,
	hidden: false,
	external: false,
	registered: false,
	productSlug: id,
	...overrides,
} );

describe( 'getMenuCatalogState', () => {
	it.each( [ 'active', 'can_upgrade', 'expiring', 'expired', 'needs_attention' ] )(
		'treats %s products as active',
		status => {
			const item = makeItem( 'stats', 'Stats', { registered: true } );
			const result = getMenuCatalogState( [ item ], {
				stats: { slug: 'stats', status: status as ProductStatus },
			} );

			expect( result.activeItems ).toEqual( [ item ] );
			expect( result.inactiveItems ).toEqual( [] );
		}
	);

	it.each( [
		'inactive',
		'module_disabled',
		'plugin_absent',
		'plugin_absent_with_plan',
		'needs_plan',
		'needs_activation',
		'needs_first_site_connection',
	] )( 'treats %s products as inactive', status => {
		const item = makeItem( 'search', 'Search', { registered: true } );
		const result = getMenuCatalogState( [ item ], {
			search: { slug: 'search', status: status as ProductStatus },
		} );

		expect( result.activeItems ).toEqual( [] );
		expect( result.inactiveItems ).toEqual( [ item ] );
	} );

	it( 'lets a real module state override an upgrade-capable product status', () => {
		const item = makeItem( 'ai', 'AI', { productSlug: 'jetpack-ai', registered: true } );
		const products = {
			'jetpack-ai': { slug: 'jetpack-ai', status: 'can_upgrade' as ProductStatus },
		};

		expect(
			getMenuCatalogState( [ item ], products, { ai: { activated: false, available: true } } )
				.inactiveItems
		).toEqual( [ item ] );
		expect(
			getMenuCatalogState( [ item ], products, { ai: { activated: true, available: true } } )
				.activeItems
		).toEqual( [ item ] );
	} );

	it( 'does not add an unregistered product to the live menu even when its product is active', () => {
		const item = makeItem( 'newsletter', 'Newsletter' );
		const result = getMenuCatalogState( [ item ], {
			newsletter: { slug: 'newsletter', status: 'active' },
		} );

		expect( result.activeItems ).toEqual( [] );
		expect( result.inactiveItems ).toEqual( [ item ] );
	} );

	it( 'keeps registered non-product destinations active and sorts inactive products by label', () => {
		const settings = makeItem( 'settings', 'Settings', {
			productSlug: undefined,
			registered: true,
			customizable: false,
		} );
		const result = getMenuCatalogState(
			[ makeItem( 'scan', 'Scan' ), settings, makeItem( 'backup', 'Backup' ) ],
			{
				scan: { slug: 'scan', status: 'inactive' },
				backup: { slug: 'backup', status: 'inactive' },
			}
		);

		expect( result.activeItems ).toEqual( [ settings ] );
		expect( result.inactiveItems.map( item => item.id ) ).toEqual( [ 'backup', 'scan' ] );
	} );
} );

describe( 'insertActivatedItem', () => {
	it( 'marks an unpositioned product as newly activated without duplicating it', () => {
		const forms = makeItem( 'forms', 'Forms' );
		const result = insertActivatedItem( [ forms ], forms );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( { registered: true, newlyActivated: true } );
	} );

	it( 'restores saved products without treating them as new', () => {
		const scan = makeItem( 'scan', 'Scan', { hasSavedOrder: true, order: 30 } );

		expect( insertActivatedItem( [], scan )[ 0 ] ).toMatchObject( {
			registered: true,
			newlyActivated: false,
			order: 30,
		} );
	} );
} );
