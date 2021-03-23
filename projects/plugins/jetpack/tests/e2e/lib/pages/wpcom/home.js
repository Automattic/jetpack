/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

export default class HomePage extends WpPage {
	constructor( page ) {
		const expectedSelector = 'body';
		const url = getRedirectUrl( 'wpcom' );
		super( page, { expectedSelectors: [ expectedSelector ], url } );
	}
}
