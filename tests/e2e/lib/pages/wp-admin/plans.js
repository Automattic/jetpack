/**
 * Internal dependencies
 */
import Page from '../page';
import { waitAndClick } from '../../page-helper';

export default class PlansPage extends Page {
	constructor( page ) {
		const expectedSelector = '.plan-features';
		super( page, { expectedSelector, explicitWaitMS: 60000 } );
	}

	async select( plan ) {
		switch ( plan ) {
			case 'personal':
				return await this.selectPlan( 'personal' );
			case 'premium':
				return await this.selectPlan( 'premium' );
			case 'pro':
				return await this.selectPlan( 'business' );
			case 'daily-backup':
				return await this.selectProduct( 'backup', 'daily' );
			case 'real-backup':
				return await this.selectProduct( 'backup', 'realtime' );

			default:
				throw new Error( `${ plan } is not valid plan type` );
		}
	}

	async selectPlan( type ) {
		const planButton = `.plan-features__table-item a[href*='${ type }']`;
		return await waitAndClick( this.page, planButton );
	}

	async selectProduct( product, type ) {
		if ( type ) {
			const typeSelector = `.plan-radio-button [value='${ type }']`;
			await waitAndClick( this.page, typeSelector );
		}

		const planButton = `.single-product__accented-card a.dops-button[href*="${ product }"]`;
		return await waitAndClick( this.page, planButton );
	}
}
