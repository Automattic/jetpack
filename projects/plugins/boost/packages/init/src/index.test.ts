import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { init } from './index';

type WithJetpackConfig = typeof globalThis & { jetpackConfig?: object };

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadI18nCatalogs: jest.fn(),
} ) );

afterEach( () => {
	delete ( globalThis as WithJetpackConfig ).jetpackConfig;
} );

it( 'loads Boost catalogs using the module URL', async () => {
	await init();

	expect( loadI18nCatalogs ).toHaveBeenCalledWith(
		'jetpack-boost',
		expect.stringMatching( /^file:.*\/packages\/init\/src\/index\.ts$/ )
	);
} );

it( 'supplies the Boost consumer slug to shared config without logging an error', async () => {
	await init();

	const error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	try {
		jest.isolateModules( () => {
			const { jetpackConfigGet, jetpackConfigHas } = require( '../../../../../js-packages/config/src' );
			expect( jetpackConfigGet( 'consumer_slug' ) ).toBe( 'jetpack-boost' );
			expect( jetpackConfigHas( 'missingConfig' ) ).toBe( false );
		} );
		expect( error ).not.toHaveBeenCalled();
	} finally {
		error.mockRestore();
	}
} );
