/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';

export default class JetpackPage extends WpPage {
	constructor( page ) {
		const url = siteUrl + '/wp-admin/admin.php?page=jetpack#/dashboard';
		super( page, { expectedSelectors: [ '#jp-plugin-container' ], url } );
	}

	async connect() {
		logger.step( 'Starting Jetpack connection' );
		const connectButtonSelector = '.jp-connect-screen .jp-connect-button--button';
		await this.click( connectButtonSelector );
		await this.waitForElementToBeHidden( this.selectors[ 0 ], 60000 );
	}

	async openMyPlan() {
		logger.step( 'Switching to My Plan tab' );
		const myPlanButton = "a[href*='my-plan'] span";
		return await this.click( myPlanButton );
	}

	async isFree() {
		logger.step( 'Checking if Free plan is active' );
		const freePlanImage = ".my-plan-card__icon img[src*='free']";
		return await this.isElementVisible( freePlanImage );
	}

	async isComplete() {
		logger.step( 'Checking if Complete plan is active' );
		const premiumPlanImage = ".my-plan-card__icon img[src*='complete']";
		return await this.isElementVisible( premiumPlanImage );
	}

	async isSecurity() {
		logger.step( 'Checking if Security plan is active' );
		const proPlanImage = ".my-plan-card__icon img[src*='security']";
		return await this.isElementVisible( proPlanImage );
	}

	async isConnected() {
		logger.step( 'Checking if Jetpack is connected' );
		await this.waitForNetworkIdle();
		const connectionInfo = '.jp-connection-settings__info';
		return await this.isElementVisible( connectionInfo );
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
		logger.step( 'Checking if Connect banner is visible' );

		const containerSelector = '.jp-connect-full__container-card';
		const buttonSelector = ".jp-connect-full__button-container a[href*='register']";

		const isCardVisible = await this.isElementVisible( containerSelector );
		const isConnectButtonVisible = await this.isElementVisible( buttonSelector );

		return isCardVisible && isConnectButtonVisible;
	}

	async isConnectScreenVisible() {
		logger.step( 'Checking if Connect screen is visible' );

		const containerSelector = '.jp-connect-screen';
		const buttonSelector = '.jp-connect-screen button.jp-connect-button--button';

		await this.waitForElementToBeVisible( containerSelector );
		const isConnectButtonVisible = await this.isElementVisible( buttonSelector );

		return isConnectButtonVisible;
	}
}
