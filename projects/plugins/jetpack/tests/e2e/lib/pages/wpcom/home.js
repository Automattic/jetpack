/**
 * Internal dependencies
 */
import Page from '../page';
import getRedirectUrl from '../../../../../_inc/client/lib/jp-redirect';

export default class HomePage extends Page {
	constructor( page ) {
		const expectedSelector = 'body';
		const url = getRedirectUrl( 'wpcom' );
		super( page, { expectedSelector, url } );
	}
}
