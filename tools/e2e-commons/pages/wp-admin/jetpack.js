import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class JetpackPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/dashboard';
		super( page, { expectedSelectors: [ '#jp-plugin-container' ], url } );
	}

	async connect() {
		logger.step( 'Starting Jetpack connection' );
		const connectButtonSelector = '.jp-connection__connect-screen .jp-action-button--button';
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

		const containerSelector = '.jp-connection__connect-screen';
		const buttonSelector = '.jp-connection__connect-screen button.jp-action-button--button';

		await this.waitForElementToBeVisible( containerSelector );
		return await this.isElementVisible( buttonSelector );
	}
}
