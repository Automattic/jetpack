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

it( 'exposes the Boost consumer slug as the jetpackConfig global', async () => {
	await init();

	expect( ( globalThis as WithJetpackConfig ).jetpackConfig ).toEqual( {
		consumer_slug: 'jetpack-boost',
	} );
} );
