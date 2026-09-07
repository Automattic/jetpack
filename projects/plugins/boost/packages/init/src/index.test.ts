import { loadI18nCatalogs } from '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs';
import { init } from './index';

jest.mock( '@automattic/jetpack-wp-build-polyfills/src/js/load-i18n-catalogs', () => ( {
	loadI18nCatalogs: jest.fn(),
} ) );

it( 'initializes navigation and waits for Boost catalogs before allowing rendering', async () => {
	let finishLoading!: () => void;
	jest.mocked( loadI18nCatalogs ).mockReturnValue(
		new Promise< void >( resolve => {
			finishLoading = resolve;
		} )
	);
	const onLocationChange = jest.fn();
	window.addEventListener( 'jetpack-boost:location-change', onLocationChange );
	const originalPushState = window.history.pushState;
	const originalReplaceState = window.history.replaceState;

	try {
		const onInitialized = jest.fn();
		const initialized = init().then( onInitialized );
		window.history.pushState( null, '', '?page=jetpack-boost&tab=settings' );
		expect( onLocationChange ).toHaveBeenCalledTimes( 1 );
		expect( window.location.search ).toBe( '?page=jetpack-boost&tab=settings' );
		expect( loadI18nCatalogs ).toHaveBeenCalledWith( 'jetpack-boost', expect.any( String ) );
		await Promise.resolve();
		expect( onInitialized ).not.toHaveBeenCalled();

		finishLoading();
		await initialized;
		expect( onInitialized ).toHaveBeenCalledTimes( 1 );
	} finally {
		window.removeEventListener( 'jetpack-boost:location-change', onLocationChange );
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
		window.history.replaceState( null, '', '/' );
	}
} );
