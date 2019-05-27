/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, waitForSelector, isEventuallyVisible } from '../../page-helper';

export default class JetpackPage extends Page {
	constructor( page ) {
		const expectedSelector = '#jp-plugin-container';
		super( page, { expectedSelector } );
	}

	async connect() {
		const connectButtonSelector = '.jp-connect-full__button-container a';
		await waitAndClick( this.page, connectButtonSelector );
		return await this.page.waitForNavigation( { waitFor: 'networkidle2' } );
	}

	async jumpstartDisplayed() {
		return !! ( await waitForSelector( this.page, '.jp-jumpstart' ) );
	}

	async openMyPlan() {
		const myPlanButton = "a[href*='my-plan'] span";
		await waitAndClick( this.page, myPlanButton );
	}

	async isPremium() {
		const premiumPlanImage = ".jp-landing__plan-card-img img[src*='premium']";
		return await isEventuallyVisible( this.page, premiumPlanImage, 2000 );
	}

	async isProfessional() {
		const proPlanImage = ".jp-landing__plan-card-img img[src*='business']";
		return await isEventuallyVisible( this.page, proPlanImage, 2000 );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return await isEventuallyVisible( this.page, connectionInfo, 2000 );
	}

	async isPlan( plan ) {
		switch ( plan ) {
			case 'premium':
				return await this.isPremium();
			case 'pro':
				return await this.isProfessional();
			default:
				throw new Error( 'Invalid plan string: ' + plan );
		}
	}
}
