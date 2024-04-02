import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.js';

export default class FirstPostPage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }/?p=1`;
		super( page, { url } );
	}
}
