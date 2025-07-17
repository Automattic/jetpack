import pwConfig from '../../playwright.config.mjs';
import WpPage from '../wp-page.js';

export default class ProfilePage extends WpPage {
	constructor( page ) {
		const url = `${ pwConfig.use[ 0 ].baseURL }/wp-admin/profile.php`;
		super( page, { expectedSelectors: [ '#profile-page' ], url } );
	}
}
