import WpPage from '../wp-page';

export default class JetpackSiteTypePage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.jetpack-connect__step .site-type__wrapper' ] } );
	}

	async selectSiteType( type ) {
		const siteTypeSelector = `button[data-e2e-title='${ type }']`;
		return await this.click( siteTypeSelector );
	}
}
