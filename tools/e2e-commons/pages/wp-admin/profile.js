import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import WpPage from '../wp-page.js';

export default class ProfilePage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/wp-admin/profile.php`;
		super( page, { expectedSelectors: [ '#profile-page' ], url } );
	}
}
