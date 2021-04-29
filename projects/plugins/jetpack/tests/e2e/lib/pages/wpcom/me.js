/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

export default class MePage extends WpPage {
	constructor( page ) {
		const expectedSelector = '#wpcom .is-section-me';
		const url = getRedirectUrl( 'calypso-me' );
		super( page, { expectedSelectors: [ expectedSelector ], url } );
	}

	async logOut() {
		const logOutSelector = '.sidebar__me-signout button';

		await this.click( logOutSelector );
		await this.waitForElementToBeHidden( this.selectors[ 0 ] );
	}
}
