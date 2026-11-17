import { isSimpleSite } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store } from '../store';
import { useSeoModuleSettings } from '../use-seo-module-settings';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => {
	const analytics = { tracks: { recordEvent: jest.fn() } };
	return { useAnalytics: () => analytics };
} );

describe( 'useSeoModuleSettings', () => {
	beforeEach( () => {
		( apiFetch as unknown as jest.Mock ).mockReset();
		dispatch( store ).setIsAutoEnhanceEnabled( false );
	} );

	it.each( [
		[ 'WordPress settings on Simple', true, '/wp/v2/settings', { ai_seo_enhancer_enabled: true } ],
		[ 'the Jetpack module elsewhere', false, 'jetpack/v4/module/seo-tools', { code: 'success' } ],
	] )( 'saves the toggle through %s', async ( _label, isSimple, path, response ) => {
		( isSimpleSite as jest.Mock ).mockReturnValue( isSimple );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( response );
		const { result } = renderHook( () => useSeoModuleSettings() );

		await act( () => result.current.toggleEnhancer( { placement: 'jetpack-sidebar' } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path, data: { ai_seo_enhancer_enabled: true } } )
		);
		expect( result.current.isEnabled ).toBe( true );
	} );

	it( 'keeps the toggle off on Simple when WordPress settings ignore the setting', async () => {
		( isSimpleSite as jest.Mock ).mockReturnValue( true );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
		const { result } = renderHook( () => useSeoModuleSettings() );

		await act( () => result.current.toggleEnhancer( { placement: 'jetpack-sidebar' } ) );

		expect( result.current.isEnabled ).toBe( false );
	} );
} );
