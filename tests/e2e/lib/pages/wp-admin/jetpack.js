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
		const freePlanImage = ".my-plan-card__icon img[src*='free']";
		return await isEventuallyVisible( this.page, freePlanImage, 20000 );
	}

	async isComplete() {
		const premiumPlanImage = ".my-plan-card__icon img[src*='complete']";
		return await isEventuallyVisible( this.page, premiumPlanImage, 20000 );
	}

	async isSecurity() {
		const proPlanImage = ".my-plan-card__icon img[src*='security']";
		return await isEventuallyVisible( this.page, proPlanImage, 20000 );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return await isEventuallyVisible( this.page, connectionInfo, 20000 );
	}

	async isPlan( plan ) {
		switch ( plan ) {
			case 'free':
				return await this.isFree();
			case 'security':
				return await this.isSecurity();
			case 'complete':
				return await this.isComplete();
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
