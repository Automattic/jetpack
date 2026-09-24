import { jest } from '@jest/globals';
import formsPackage from '../../../package.json';

const loadI18nCatalogs = jest.fn();
jest.unstable_mockModule(
	'@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs',
	() => ( { loadI18nCatalogs } )
);

const { init } = await import( './index' );

type WithJetpackConfig = typeof globalThis & { jetpackConfig?: object };

afterEach( () => {
	delete ( globalThis as WithJetpackConfig ).jetpackConfig;
} );

it( 'loads Forms catalogs using the module URL', async () => {
	await init();

	expect( loadI18nCatalogs ).toHaveBeenCalledWith(
		'jetpack-forms',
		expect.stringMatching( /^file:.*\/packages\/init\/src\/index\.ts$/ )
	);
} );

it( 'supplies the Forms consumer slug after init', async () => {
	await init();

	expect( ( globalThis as WithJetpackConfig ).jetpackConfig ).toEqual( {
		consumer_slug: 'jetpack-forms',
	} );
} );

it( 'is wired as an init module of the responses page', () => {
	const page = formsPackage.wpPlugin.pages.find( ( { id } ) => id === 'jetpack-forms-responses' );

	expect( page?.init ).toContain( '@jetpack-forms/init' );
} );
