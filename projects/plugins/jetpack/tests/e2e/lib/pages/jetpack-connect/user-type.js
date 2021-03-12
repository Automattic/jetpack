/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class JetpackUserTypePage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.user-type__connect-step';
		super( page, 'JetpackUserTypePage', { expectedSelector } );
	}

	async selectUserType( userType ) {
		const userTypeSelector = `button[data-e2e-slug='${ userType }']`;
		return await page.click( userTypeSelector );
	}
}
