import pwConfig from '../../playwright.config.mjs';
import WpPage from '../wp-page.js';

export default class SitePage extends WpPage {
	constructor( page ) {
		const url = pwConfig.use[ 0 ].baseURL;
		super( page, { url } );
	}
}
