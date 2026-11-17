import analytics from '@automattic/jetpack-analytics';
import { render } from '@testing-library/react';
import WrappedDashboard from '../wrapped-dashboard';

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );
jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: { setApiRoot: jest.fn(), setWpcomOriginApiUrl: jest.fn(), setApiNonce: jest.fn() },
} ) );
jest.mock( '@wordpress/data', () => {
	const selectors = {
		isNewPricing202208: () => false,
		getWpcomUser: () => null,
		getBlogId: () => 1,
		getAPIRootUrl: () => null,
		getWpcomOriginApiUrl: () => null,
		getAPINonce: () => null,
		getVersion: () => '1.0',
	};
	return {
		useSelect: callback => callback( () => selectors ),
		select: () => selectors,
	};
} );
jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );
jest.mock( 'hooks/use-connection', () => () => ( { isFullyConnected: false } ) );
jest.mock( 'components/pages/connection-page', () => () => null );
jest.mock( 'components/pages/dashboard-page', () => () => null );
jest.mock( 'components/pages/upsell-page', () => () => null );

const shown = ( page, firstShow ) =>
	window.dispatchEvent(
		new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page, firstShow } } )
	);

describe( 'WrappedDashboard', () => {
	it( 'records the page view again when the admin shell shows Search again, not on its first show', () => {
		render( <WrappedDashboard /> );

		shown( 'jetpack-search', true );
		shown( 'my-jetpack', false );
		shown( 'jetpack-search', false );

		const view = [ 'jetpack_search_admin_page_view', { current_version: '1.0' } ];
		expect( analytics.tracks.recordEvent.mock.calls ).toEqual( [ view, view ] );
	} );
} );
