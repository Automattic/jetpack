/**
 * Internal dependencies
 */
import Page from '../page';

export default class HomePage extends Page {
	constructor( page ) {
		const expectedSelector = 'body';
		const url = 'https://wordpress.com/';
		super( page, { expectedSelector, url } );
	}
}
