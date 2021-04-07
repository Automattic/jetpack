/**
 * Internal dependencies
 */
import WpPage from './wp-page';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/`;
		super( page, { expectedSelectors: [ '.post' ], url } );
	}
}
