/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';

export default class JetpackPage extends WpPage {
	constructor( page ) {
		const expectedSelector = '#jp-plugin-container';
		super( page, 'JetpackPage', { expectedSelector } );
	}

	async connect() {
		const connectButtonSelector = '.jp-connect-full__button-container .dops-button';
		return await this.click( connectButtonSelector, { timeout: 60000 } );
	}

	async openMyPlan() {
		const myPlanButton = "a[href*='my-plan'] span";
		return await this.click( myPlanButton );
	}

	async isFree() {
		const freePlanImage = ".my-plan-card__icon img[src*='free']";
		return this.isElementVisible( freePlanImage );
	}

	async isComplete() {
		const premiumPlanImage = ".my-plan-card__icon img[src*='complete']";
		return this.isElementVisible( premiumPlanImage );
	}

	async isSecurity() {
		const proPlanImage = ".my-plan-card__icon img[src*='security']";
		return this.isElementVisible( proPlanImage );
	}

	async isConnected() {
		const connectionInfo = '.jp-connection-settings__info';
		return this.isElementVisible( connectionInfo );
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

		logger.step( 'Checking Connect banner is visible' );
		const isCardVisible = await this.isElementVisible( containerSelector );
		const isConnectButtonVisible = await this.isElementVisible( buttonSelector );
		return isCardVisible && isConnectButtonVisible;
	}
}
