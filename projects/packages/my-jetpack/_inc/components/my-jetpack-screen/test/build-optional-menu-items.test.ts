/**
 * @jest-environment node
 */
import buildOptionalMenuItems from '../build-optional-menu-items';

const baseArgs = {
	adminUrl: 'https://example.com/wp-admin/',
	isDevVersion: false,
	userIsAdmin: true,
	isSiteConnected: true,
	isJetpackPluginActive: true,
	onModulesClick: jest.fn(),
	onResetClick: jest.fn(),
	onResetKeyDown: jest.fn(),
};

describe( 'buildOptionalMenuItems', () => {
	describe( 'Modules link', () => {
		it( 'includes the Modules link for an admin on a connected self-hosted site', () => {
			const items = buildOptionalMenuItems( baseArgs );

			expect( items ).toHaveLength( 1 );
			expect( items[ 0 ] ).toMatchObject( {
				label: 'Modules',
				href: 'https://example.com/wp-admin/admin.php?page=jetpack_modules',
			} );
		} );

		it( 'omits the Modules link for non-admin users', () => {
			const items = buildOptionalMenuItems( { ...baseArgs, userIsAdmin: false } );

			expect( items.find( item => item.label === 'Modules' ) ).toBeUndefined();
		} );

		it( 'omits the Modules link when the site is not connected', () => {
			const items = buildOptionalMenuItems( { ...baseArgs, isSiteConnected: false } );

			expect( items.find( item => item.label === 'Modules' ) ).toBeUndefined();
		} );

		it( 'omits the Modules link when the main Jetpack plugin is not active', () => {
			const items = buildOptionalMenuItems( { ...baseArgs, isJetpackPluginActive: false } );

			expect( items.find( item => item.label === 'Modules' ) ).toBeUndefined();
		} );

		it( 'invokes onModulesClick when the Modules link is clicked', () => {
			const onModulesClick = jest.fn();
			const items = buildOptionalMenuItems( { ...baseArgs, onModulesClick } );

			items[ 0 ].onClick?.();

			expect( onModulesClick ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'Reset options entry (dev only)', () => {
		it( 'includes the Reset options entry for an admin on a dev build', () => {
			const items = buildOptionalMenuItems( { ...baseArgs, isDevVersion: true } );

			const reset = items.find( item => item.label === 'Reset options (devs)' );
			expect( reset ).toBeDefined();
		} );

		it( 'omits the Reset options entry on non-dev builds', () => {
			const items = buildOptionalMenuItems( { ...baseArgs, isDevVersion: false } );

			expect( items.find( item => item.label === 'Reset options (devs)' ) ).toBeUndefined();
		} );

		it( 'omits the Reset options entry for non-admin users on a dev build', () => {
			const items = buildOptionalMenuItems( {
				...baseArgs,
				isDevVersion: true,
				userIsAdmin: false,
			} );

			expect( items.find( item => item.label === 'Reset options (devs)' ) ).toBeUndefined();
		} );

		it( 'wires onResetClick and onResetKeyDown to the Reset options entry', () => {
			const onResetClick = jest.fn();
			const onResetKeyDown = jest.fn();
			const items = buildOptionalMenuItems( {
				...baseArgs,
				isDevVersion: true,
				onResetClick,
				onResetKeyDown,
			} );

			const reset = items.find( item => item.label === 'Reset options (devs)' );
			reset?.onClick?.();
			reset?.onKeyDown?.( { key: 'Enter' } as unknown as KeyboardEvent );

			expect( onResetClick ).toHaveBeenCalledTimes( 1 );
			expect( onResetKeyDown ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	it( 'returns an empty array when nothing applies', () => {
		const items = buildOptionalMenuItems( {
			...baseArgs,
			userIsAdmin: false,
			isSiteConnected: false,
			isJetpackPluginActive: false,
			isDevVersion: false,
		} );

		expect( items ).toEqual( [] );
	} );
} );
