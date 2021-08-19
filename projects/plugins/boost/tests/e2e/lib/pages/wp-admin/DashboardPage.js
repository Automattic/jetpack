/**
 * Internal dependencies
 */
import WpPage from '../WpPage';

export default class DashboardPage extends WpPage {
	constructor( page ) {
		const url = `${ siteUrl }/wp-admin`;
		super( page, { expectedSelectors: [ '#dashboard-widgets-wrap' ], url } );
	}
}
