import WpPage from 'jetpack-e2e-commons/pages/wp-page';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ resolveSiteUrl() }`;
		super( page, { expectedSelectors: [ '.home' ], url } );
	}
}
