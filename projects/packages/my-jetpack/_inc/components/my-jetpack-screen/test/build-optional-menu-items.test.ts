/**
 * @jest-environment node
 */
import buildOptionalMenuItems from '../build-optional-menu-items';

const baseArgs = {
	isDevVersion: false,
	userIsAdmin: true,
	onResetClick: jest.fn(),
	onResetKeyDown: jest.fn(),
};

describe( 'buildOptionalMenuItems', () => {
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
			isDevVersion: false,
		} );

		expect( items ).toEqual( [] );
	} );
} );
