/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick, isEventuallyVisible } from '../../page-helper';

export default class JetpackPage extends Page {
	constructor( page ) {
		const expectedSelector = '#jp-plugin-container';
		super( page, { expectedSelector } );
	}

	async connect() {
		const connectButtonSelector = '.jp-connect-full__button-container .dops-button';
		return await waitAndClick( this.page, connectButtonSelector );
	}

	async openMyPlan() {
		const myPlanButton = "a[href*='my-plan'] span";
		return await waitAndClick( this.page, myPlanButton );
	}

	async isFree() {
		const premiumPlanImage = ".my-plan-card__icon img[src*='free']";
		return await isEventuallyVisible( this.page, premiumPlanImage, 20000 );
	}

	async isPremium() {
		const premiumPlanImage = ".my-plan-card__icon img[src*='premium']";
		return await isEventuallyVisible( this.page, premiumPlanImage, 20000 );
	}

	async isProfessional() {
		const proPlanImage = ".my-plan-card__icon img[src*='business']";
		return await isEventuallyVisible( this.page, proPlanImage, 20000 );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return await isEventuallyVisible( this.page, connectionInfo, 20000 );
	}

	async isPlan( plan ) {
		switch ( plan ) {
			case 'free':
				return await this.isPremium();
			case 'premium':
				return await this.isPremium();
			case 'pro':
				return await this.isProfessional();
			default:
				throw new Error( 'Invalid plan string: ' + plan );
		}
	}

	async isConnectBannerVisible() {
		const containerSelector = '.jp-connect-full__container-card';
		const buttonSelector = ".jp-connect-full__button-container a[href*='register']";

		const isCardVisible = await isEventuallyVisible( this.page, containerSelector );
		const isConnectButtonVisible = await isEventuallyVisible( this.page, buttonSelector );
		return isCardVisible && isConnectButtonVisible;
	}
}
