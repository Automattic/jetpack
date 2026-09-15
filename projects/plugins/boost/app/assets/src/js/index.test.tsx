import { SETTINGS_SLOT_ID, SUBPAGE_SLOT_ID } from '../../../../_inc/runtime-contract';
import { LEGACY_ROOT_ID, MODERN_ROOT_ID } from '$lib/modern/mode';

const mockRender = jest.fn();
const mockCreateRoot = jest.fn( ( _container: HTMLElement ) => ( { render: mockRender } ) );

jest.mock( '@wordpress/element', () => ( {
	createRoot: ( container: HTMLElement ) => mockCreateRoot( container ),
} ) );
jest.mock( './main', () => ( { __esModule: true, default: () => null } ) );
jest.mock( '$layout/modern/modern-app', () => ( { __esModule: true, default: () => null } ) );

const addRoot = ( id: string ) => {
	const root = document.createElement( 'div' );
	root.id = id;
	document.body.appendChild( root );

	return root;
};

const boot = async () => {
	jest.isolateModules( () => {
		// eslint-disable-next-line @typescript-eslint/no-require-imports -- the entry mounts on import, so each case needs a fresh one.
		require( './index' );
	} );
	// The modern path awaits the chassis slots before it mounts.
	await Promise.resolve();
	await Promise.resolve();
};

describe( 'dashboard boot', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		mockCreateRoot.mockClear();
		mockRender.mockClear();
	} );

	it( 'mounts today’s dashboard into the root PHP renders for it', async () => {
		const legacyRoot = addRoot( LEGACY_ROOT_ID );

		await boot();

		expect( mockCreateRoot ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateRoot ).toHaveBeenCalledWith( legacyRoot );
	} );

	it( 'mounts nothing when neither root is present', async () => {
		await boot();

		expect( mockCreateRoot ).not.toHaveBeenCalled();
	} );

	it( 'mounts one root, in the Settings slot', async () => {
		addRoot( MODERN_ROOT_ID );
		const settingsSlot = addRoot( SETTINGS_SLOT_ID );
		addRoot( SUBPAGE_SLOT_ID );

		await boot();

		expect( mockCreateRoot ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateRoot ).toHaveBeenCalledWith( settingsSlot );
	} );

	it( 'waits for the chassis slots before mounting the modern app', async () => {
		addRoot( MODERN_ROOT_ID );

		await boot();
		expect( mockCreateRoot ).not.toHaveBeenCalled();

		addRoot( SETTINGS_SLOT_ID );
		addRoot( SUBPAGE_SLOT_ID );
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( mockCreateRoot ).toHaveBeenCalledTimes( 1 );
	} );
} );
