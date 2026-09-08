import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { init } from './index';

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadI18nCatalogs: jest.fn(),
} ) );

it( 'waits for Boost catalogs before allowing rendering', async () => {
	let finishLoading!: () => void;
	jest.mocked( loadI18nCatalogs ).mockReturnValue(
		new Promise< void >( resolve => {
			finishLoading = resolve;
		} )
	);
	const onInitialized = jest.fn();
	const initialized = init().then( onInitialized );
	expect( loadI18nCatalogs ).toHaveBeenCalledWith( 'jetpack-boost', expect.any( String ) );
	await Promise.resolve();
	expect( onInitialized ).not.toHaveBeenCalled();

	finishLoading();
	await initialized;
	expect( onInitialized ).toHaveBeenCalledTimes( 1 );
} );
