/**
 * Internal dependencies
 */
import WpPage from './WpPage';

export default class Homepage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }`;
		super( page, { expectedSelectors: [ '.home' ], url } );
	}
}
