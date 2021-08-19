/**
 * Internal dependencies
 */
import WpPage from '../WpPage';

export default class JetpackBoostPage extends WpPage {
	constructor( page ) {
		const url = siteUrl + '/wp-admin/admin.php?page=jetpack-boost';
		super( page, { expectedSelectors: [ '#jb-settings' ], url } );
	}
}
