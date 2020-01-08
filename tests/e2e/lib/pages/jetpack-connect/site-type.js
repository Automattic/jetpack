/**
 * External dependencies
 */
import { waitAndClick, Page } from 'puppeteer-utils';

export default class JetpackSiteTypePage extends Page {
	constructor( page ) {
		const expectedSelector = '.jetpack-connect__step .site-type__wrapper';
		super( page, { expectedSelector } );
	}

	async selectSiteType( type ) {
		const siteTypeSelector = `button[data-e2e-title='${ type }']`;
		return await waitAndClick( this.page, siteTypeSelector );
	}
}
