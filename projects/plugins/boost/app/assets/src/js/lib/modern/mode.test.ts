import { SETTINGS_SLOT_ID, SUBPAGE_SLOT_ID } from '../../../../../../_inc/runtime-contract';
import { waitForSlots } from './mode';

const addRoot = ( id: string ) => {
	const root = document.createElement( 'div' );
	root.id = id;
	document.body.appendChild( root );

	return root;
};

describe( 'waitForSlots', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'resolves immediately when both slots already exist', async () => {
		const settings = addRoot( SETTINGS_SLOT_ID );
		const subpage = addRoot( SUBPAGE_SLOT_ID );

		await expect( waitForSlots() ).resolves.toEqual( { settings, subpage } );
	} );

	it( 'waits for slots the chassis has not rendered yet', async () => {
		const pending = waitForSlots();
		addRoot( SETTINGS_SLOT_ID );
		const subpage = addRoot( SUBPAGE_SLOT_ID );

		await expect( pending ).resolves.toEqual( {
			settings: document.getElementById( SETTINGS_SLOT_ID ),
			subpage,
		} );
	} );

	it( 'stays pending while only one slot exists', async () => {
		let settled = false;
		waitForSlots().then( () => {
			settled = true;
		} );
		addRoot( SETTINGS_SLOT_ID );

		await Promise.resolve();

		expect( settled ).toBe( false );
	} );
} );
