import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { init } from './index';

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadI18nCatalogs: jest.fn(),
} ) );

it( 'loads Boost catalogs using the module URL', async () => {
	await init();

	expect( loadI18nCatalogs ).toHaveBeenCalledWith(
		'jetpack-boost',
		expect.stringMatching( /^file:.*\/packages\/init\/src\/index\.ts$/ )
	);
} );
