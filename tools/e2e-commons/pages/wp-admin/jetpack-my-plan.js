import WpPage from '../wp-page.js';
import logger from '../../logger.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.js';

export default class JetpackMyPlanPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/my-plan';
		super( page, { expectedSelectors: [ '#jp-plugin-container', '.jp-landing__plans' ], url } );
	}

	async isFree() {
		logger.step( 'Checking if Free plan is active' );
		const freePlanTitle = '//h2[@class="my-plan-card__title"][text()="Jetpack Free"]';
		return await this.isElementVisible( freePlanTitle );
	}

	async isComplete() {
		logger.step( 'Checking if Complete plan is active' );
		const completePlanTitle = '//h2[@class="my-plan-card__title"][text()="Jetpack Complete"]';
		return await this.isElementVisible( completePlanTitle );
	}

	async isSecurity() {
		logger.step( 'Checking if Security plan is active' );
		const securityPlanTitle = '//h2[@class="my-plan-card__title"][text()="Jetpack Security"]';
		return await this.isElementVisible( securityPlanTitle );
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
}
