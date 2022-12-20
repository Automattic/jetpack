import PageActions from '../../page-actions.js';

export default class FormBlock extends PageActions {
	constructor( blockId, page ) {
		super( page, 'Form block' );
		this.blockTitle = FormBlock.title();
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'contact-form';
	}

	static title() {
		return 'Form';
	}

	async selectFormVariation( variationText = 'Contact Form' ) {
		await this.click( `text=${ variationText }` );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.waitForSelector( 'form.wp-block-jetpack-contact-form' );
	}
}
