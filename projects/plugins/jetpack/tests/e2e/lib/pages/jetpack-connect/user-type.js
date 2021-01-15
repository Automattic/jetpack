/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class JetpackUserTypePage extends Page {
	constructor( page ) {
		const expectedSelector = '.user-type__connect-step';
		super( page, { expectedSelector } );
	}

	async selectUserType( userType ) {
		const userTypeSelector = `button[data-e2e-slug='${ userType }']`;
		return await waitAndClick( this.page, userTypeSelector );
	}
}
