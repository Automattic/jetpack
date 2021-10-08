/**
 * Internal dependencies
 */
import WpPage from 'jetpack-e2e-commons/pages/wp-page';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }`;
		super( page, { expectedSelectors: [ '.home' ], url } );
	}
}
