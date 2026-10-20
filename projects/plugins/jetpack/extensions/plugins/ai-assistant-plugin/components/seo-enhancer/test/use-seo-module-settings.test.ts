import { isSimpleSite } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { store } from '../store';
import { useSeoModuleSettings } from '../use-seo-module-settings';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => Promise.resolve( {} ) ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => {
	const analytics = { tracks: { recordEvent: jest.fn() } };
	return { useAnalytics: () => analytics };
} );

describe( 'useSeoModuleSettings', () => {
	beforeEach( () => {
		( apiFetch as unknown as jest.Mock ).mockClear();
		dispatch( store ).setIsAutoEnhanceEnabled( false );
	} );

	it.each( [
		[ 'WordPress settings on Simple', true, '/wp/v2/settings' ],
		[ 'the Jetpack module elsewhere', false, 'jetpack/v4/module/seo-tools' ],
	] )( 'saves the toggle through %s', async ( _label, isSimple, path ) => {
		( isSimpleSite as jest.Mock ).mockReturnValue( isSimple );
		const { result } = renderHook( () => useSeoModuleSettings() );

		await act( () => result.current.toggleEnhancer( { placement: 'jetpack-sidebar' } ) );

		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path, data: { ai_seo_enhancer_enabled: true } } )
		);
		expect( result.current.isEnabled ).toBe( true );
	} );
} );
