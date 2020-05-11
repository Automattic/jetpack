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

	async openPlans() {
		const plansButton = "a[href*='plans'] span";
		return await waitAndClick( this.page, plansButton );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return await isEventuallyVisible( this.page, connectionInfo, 20000 );
	}

	async isPlan( plan ) {
		switch ( plan ) {
			case 'free':
				return await this._isPlan( 'free' );
			case 'personal':
				return await this._isPlan( 'personal' );
			case 'premium':
				return await this._isPlan( 'premium' );
			case 'pro':
				return await this._isPlan( 'business' );
			default:
				throw new Error( 'Invalid plan string: ' + plan );
		}
	}

	async isProduct( product ) {
		switch ( product ) {
			case 'backup':
				return await this._isPlan( 'backup' );
			case 'search':
				return await this._isPlan( 'search' );
			case 'scan':
				return await this._isPlan( 'scan' );
			default:
				throw new Error( 'Invalid product string: ' + product );
		}
	}

	async _isPlan( plan ) {
		const imageSelector = `.my-plan-card__icon img[src*='${ plan }']`;
		return await isEventuallyVisible( this.page, imageSelector, 20000 );
	}

	async isConnectBannerVisible() {
		const containerSelector = '.jp-connect-full__container-card';
		const buttonSelector = ".jp-connect-full__button-container a[href*='register']";

		const isCardVisible = await isEventuallyVisible( this.page, containerSelector );
		const isConnectButtonVisible = await isEventuallyVisible( this.page, buttonSelector );
		return isCardVisible && isConnectButtonVisible;
	}
}
