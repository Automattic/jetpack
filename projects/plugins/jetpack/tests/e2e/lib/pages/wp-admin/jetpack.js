/**
 * Internal dependencies
 */
import Page from '../page';

export default class JetpackPage extends Page {
	constructor( page ) {
		const expectedSelector = '#jp-plugin-container';
		super( page, 'JetpackPage', { expectedSelector } );
	}

	async connect() {
		const connectButtonSelector = '.jp-connect-full__button-container .dops-button';
		return await page.click( connectButtonSelector, { timeout: 60000 } );
	}

	async openMyPlan() {
		const myPlanButton = "a[href*='my-plan'] span";
		return await page.click( myPlanButton );
	}

	async isFree() {
		const freePlanImage = ".my-plan-card__icon img[src*='free']";
		return this.page.isVisible( freePlanImage );
	}

	async isComplete() {
		const premiumPlanImage = ".my-plan-card__icon img[src*='complete']";
		return this.page.isVisible( premiumPlanImage );
	}

	async isSecurity() {
		const proPlanImage = ".my-plan-card__icon img[src*='security']";
		return this.page.isVisible( proPlanImage );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return this.page.isVisible( connectionInfo );
	}

	async forceVariation( variation = 'original' ) {
		return await this.page.evaluate(
			forceVariation => ( jpConnect.forceVariation = forceVariation ),
			variation
		);
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

		const isCardVisible = await this.page.isVisible( containerSelector );
		const isConnectButtonVisible = await this.page.isVisible( buttonSelector );
		return isCardVisible && isConnectButtonVisible;
	}
}
