/**
 * Internal dependencies
 */
import Page from '../page';

export default class DashboardPage extends Page {
	constructor( page ) {
		const expectedSelector = '#dashboard-widgets-wrap';
		super( page, { expectedSelector } );
	}
}
