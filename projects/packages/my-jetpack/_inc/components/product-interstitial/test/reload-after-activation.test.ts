import { setPendingSuccessNotice } from '../../my-jetpack-tab-panel/products/pending-notice';
import { loadMyJetpackHomePage } from '../../my-jetpack-tab-panel/products/reload-page';
import { reloadIfActivationChangesAdminMenu } from '../reload-after-activation';

// window.location can't be mocked directly, so the navigation lives in mockable wrappers.
jest.mock( '../../my-jetpack-tab-panel/products/pending-notice' );
jest.mock( '../../my-jetpack-tab-panel/products/reload-page' );

describe( 'reloadIfActivationChangesAdminMenu', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'leaves with a full page load for VideoPress, persisting the success notice', () => {
		// VideoPress changes the "Jetpack > VideoPress" sidebar link on activation,
		// so the app must be left through a real page load to re-render it.
		expect( reloadIfActivationChangesAdminMenu( 'videopress', 'VideoPress' ) ).toBe( true );

		expect( setPendingSuccessNotice ).toHaveBeenCalledWith( 'VideoPress activated successfully!' );
		expect( loadMyJetpackHomePage ).toHaveBeenCalled();
	} );

	it( 'does nothing for products that do not change wp-admin menus', () => {
		expect( reloadIfActivationChangesAdminMenu( 'search', 'Search' ) ).toBe( false );

		expect( setPendingSuccessNotice ).not.toHaveBeenCalled();
		expect( loadMyJetpackHomePage ).not.toHaveBeenCalled();
	} );
} );
