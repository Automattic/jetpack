import WpPage from '../wp-page.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class SitePage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl();
		super( page, { url } );
	}
}
