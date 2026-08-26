import {
	addCustomSeparator,
	buildMenuSequence,
	hasDraftChanged,
	moveEditableNode,
	removeCustomSeparator,
	reorderEditableNodes,
	serializeDraftLayout,
	updateCustomSeparator,
} from '../menu-sequence';
import type { AdminMenuItem, AdminMenuSeparator } from '../types';

const makeMenuItem = (
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
	...overrides,
} );

const makeDefaultItems = () => [
	makeMenuItem( 'my-jetpack', 'My Jetpack', { customizable: false } ),
	makeMenuItem( 'scan', 'Scan' ),
	makeMenuItem( 'forms', 'Forms' ),
	makeMenuItem( 'ai', 'AI Assistant' ),
	makeMenuItem( 'settings', 'Settings', { customizable: false, external: true } ),
	makeMenuItem( 'jetpack-manage', 'Jetpack Manage', {
		customizable: false,
		external: true,
	} ),
	makeMenuItem( 'cloud', 'Jetpack Cloud', { customizable: false, external: true } ),
];

describe( 'buildMenuSequence', () => {
	it( 'places alphabetized products between protected anchors and before off-site items', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {} );

		expect( sequence.map( node => node.id ) ).toEqual( [
			'my-jetpack',
			'base-products-start',
			'ai',
			'forms',
			'scan',
			'base-products-end',
			'settings',
			'jetpack-manage',
			'cloud',
		] );
		expect( sequence.filter( node => node.locked ).map( node => node.id ) ).toEqual( [
			'my-jetpack',
			'base-products-start',
			'base-products-end',
			'settings',
			'jetpack-manage',
			'cloud',
		] );
	} );

	it( 'does not create base separators when no on-site products are registered', () => {
		const items = makeDefaultItems().filter( item =>
			[ 'my-jetpack', 'settings', 'jetpack-manage' ].includes( item.id )
		);

		expect( buildMenuSequence( items, {} ).map( node => node.id ) ).toEqual( [
			'my-jetpack',
			'settings',
			'jetpack-manage',
		] );
	} );

	it( 'interleaves saved custom separators with saved product order', () => {
		const items = makeDefaultItems().map( item => {
			if ( item.id === 'scan' ) {
				return { ...item, hasSavedOrder: true, order: 10 };
			}
			if ( item.id === 'forms' ) {
				return { ...item, hasSavedOrder: true, order: 30 };
			}
			if ( item.id === 'ai' ) {
				return { ...item, hasSavedOrder: true, order: 40 };
			}
			return item;
		} );
		const separators: Record< string, AdminMenuSeparator > = {
			security: { id: 'security', title: 'Security', order: 20 },
		};

		const sequence = buildMenuSequence( items, separators );

		expect( sequence.slice( 1, 7 ).map( node => node.id ) ).toEqual( [
			'base-products-start',
			'scan',
			'security',
			'forms',
			'ai',
			'base-products-end',
		] );
		expect( sequence.find( node => node.id === 'security' ) ).toMatchObject( {
			type: 'separator',
			title: 'Security',
			base: false,
			locked: false,
		} );
	} );

	it( 'preserves blank custom separator titles', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {
			untitled: { id: 'untitled', title: '', order: 15 },
		} );

		expect( sequence.find( node => node.id === 'untitled' ) ).toMatchObject( { title: '' } );
	} );
} );

describe( 'editing a menu sequence', () => {
	it( 'reorders only editable product and custom separator rows', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {
			security: { id: 'security', title: 'Security', order: 15 },
		} );
		const reordered = reorderEditableNodes( sequence, [ 'scan', 'security', 'ai', 'forms' ] );

		expect( reordered.map( node => node.id ) ).toEqual( [
			'my-jetpack',
			'base-products-start',
			'scan',
			'security',
			'ai',
			'forms',
			'base-products-end',
			'settings',
			'jetpack-manage',
			'cloud',
		] );
	} );

	it( 'does not move an editable row across a protected base separator', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {} );
		const firstProductId = sequence[ 2 ].id;

		expect( moveEditableNode( sequence, firstProductId, -1 ) ).toEqual( sequence );
	} );

	it( 'adds, renames, and removes a custom separator in the product region', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {} );
		const withSeparator = addCustomSeparator( sequence, 'custom-tools' );
		const renamed = updateCustomSeparator( withSeparator, 'custom-tools', 'Tools' );

		expect( renamed.find( node => node.id === 'custom-tools' ) ).toMatchObject( {
			title: 'Tools',
			locked: false,
		} );
		expect( removeCustomSeparator( renamed, 'custom-tools' ) ).toEqual( sequence );
	} );

	it( 'serializes item visibility and custom separator order without base separators', () => {
		const sequence = buildMenuSequence(
			makeDefaultItems().map( item => ( item.id === 'forms' ? { ...item, hidden: true } : item ) ),
			{ security: { id: 'security', title: '', order: 15 } }
		);
		const layout = serializeDraftLayout( sequence );

		expect( layout.items.forms.hidden ).toBe( true );
		expect( layout.separators.security.title ).toBe( '' );
		expect( layout.separators ).not.toHaveProperty( 'base-products-start' );
		expect( layout.separators ).not.toHaveProperty( 'base-products-end' );
	} );

	it( 'compares normalized drafts for the unsaved state', () => {
		const sequence = buildMenuSequence( makeDefaultItems(), {} );
		const changed = moveEditableNode( sequence, 'forms', 1 );

		expect( hasDraftChanged( sequence, sequence ) ).toBe( false );
		expect( hasDraftChanged( sequence, changed ) ).toBe( true );
	} );
} );
