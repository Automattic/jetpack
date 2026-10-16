import { setPendingSuccessNotice } from '../../../utils/pending-notice';
import { loadMyJetpackHomePage } from '../../../utils/reload-page';
import { reloadIfActivationChangesAdminMenu } from '../reload-after-activation';

// window.location can't be mocked directly, so the navigation lives in mockable wrappers.
jest.mock( '../../../utils/pending-notice' );
jest.mock( '../../../utils/reload-page' );

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
