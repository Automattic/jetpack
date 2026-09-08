import {
	detectMode,
	LEGACY_ROOT_ID,
	MODERN_ROOT_ID,
	SETTINGS_SLOT_ID,
	SUBPAGE_SLOT_ID,
	waitForSlots,
} from './mode';

const addRoot = ( id: string ) => {
	const root = document.createElement( 'div' );
	root.id = id;
	document.body.appendChild( root );

	return root;
};

describe( 'detectMode', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'reads legacy from the legacy root', () => {
		addRoot( LEGACY_ROOT_ID );

		expect( detectMode() ).toBe( 'legacy' );
	} );

	it( 'reads modern from the chassis root', () => {
		addRoot( MODERN_ROOT_ID );

		expect( detectMode() ).toBe( 'modern' );
	} );

	it( 'returns null when neither root is present', () => {
		expect( detectMode() ).toBeNull();
	} );

	it( 'prefers legacy when both roots are present', () => {
		addRoot( MODERN_ROOT_ID );
		addRoot( LEGACY_ROOT_ID );

		expect( detectMode() ).toBe( 'legacy' );
	} );
} );

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
