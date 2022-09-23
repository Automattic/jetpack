import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';

export default class JetpackMyPlanPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack#/my-plan';
		super( page, { expectedSelectors: [ '#jp-plugin-container', '.jp-landing__plans' ], url } );
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
