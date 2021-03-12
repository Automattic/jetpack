/**
 * Internal dependencies
 */
import WpPage from '../wp-page';

export default class JetpackSiteTypePage extends WpPage {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__step .site-type__wrapper';
		super( page, 'JetpackSiteTypePage', { expectedSelector } );
	}

	async selectSiteType( type ) {
		const siteTypeSelector = `button[data-e2e-title='${ type }']`;
		return await page.click( siteTypeSelector );
	}
}
