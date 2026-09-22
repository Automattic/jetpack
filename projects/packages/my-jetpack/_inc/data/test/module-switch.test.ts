import { act, renderHook, waitFor } from '@testing-library/react';
import { hasPlainSwitch, requestModuleSwitch } from '../module-switch';
import { moduleSwitchKey, useRequestedSwitch } from '../requested-switch-state';
import type { MyJetpackModule } from '../../types';

jest.mock( '../../utils/block-theme-migration', () => ( {
	getBlockThemeMigration: ( $module: { module: string } ) =>
		$module.module === 'sharedaddy' ? { editorUrl: '' } : null,
} ) );

const buildModule = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( { module: 'stats', available: true, activated: false, ...overrides } ) as MyJetpackModule;

describe( 'hasPlainSwitch', () => {
	it( 'is true for an ordinary module', () => {
		expect( hasPlainSwitch( buildModule() ) ).toBe( true );
	} );

	it( 'is false for a module forced on or off', () => {
		expect( hasPlainSwitch( buildModule( { override: 'active' } ) ) ).toBe( false );
	} );

	it( 'is false for a module whose control is a block-theme migration', () => {
		expect( hasPlainSwitch( buildModule( { module: 'sharedaddy' } ) ) ).toBe( false );
	} );
} );

describe( 'requestModuleSwitch', () => {
	const asked = () => renderHook( () => useRequestedSwitch( moduleSwitchKey( 'stats' ) ) );

	it( 'holds the asked-for value while the request is out, then clears it', async () => {
		let settle: ( value: boolean ) => void = () => undefined;
		const toggle = jest.fn( () => new Promise< boolean >( resolve => ( settle = resolve ) ) );

		const request = requestModuleSwitch( toggle, 'stats', true );
		const { result, rerender } = asked();

		expect( result.current ).toBe( true );

		// The queue starts every request on a later microtask.
		await waitFor( () => expect( toggle ).toHaveBeenCalled() );
		await act( async () => {
			settle( true );
			await expect( request ).resolves.toBe( true );
		} );
		rerender();

		expect( result.current ).toBeNull();
		expect( toggle ).toHaveBeenCalledWith( { name: 'stats', active: true } );
	} );

	it( 'resolves false and clears the asked-for value when the request rejects', async () => {
		const toggle = jest.fn( () => Promise.reject( new Error( 'nope' ) ) );

		await expect( requestModuleSwitch( toggle, 'stats', false ) ).resolves.toBe( false );

		expect( asked().result.current ).toBeNull();
	} );
} );
