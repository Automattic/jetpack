import WpPage from '../wp-page.js';

export default class JetpackUserTypePage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.user-type__connect-step' ] } );
	}

	async selectUserType( userType ) {
		const userTypeSelector = `button[data-e2e-slug='${ userType }']`;
		return await this.click( userTypeSelector );
	}
}
