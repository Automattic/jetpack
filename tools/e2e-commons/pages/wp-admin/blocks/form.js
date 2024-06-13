import EditorCanvas from './editor-canvas.js';
import logger from '../../../logger.js';
export default class FormBlock extends EditorCanvas {
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

	async selectFormVariation() {
		logger.step( `Selecting form variation` );
		await this.canvas().click( `button:has-text('Explore Form Patterns')` );
		await this.click( `button[aria-label='Carousel view']` );
		await this.click( `button:has-text('Choose')` );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.locator( 'form.wp-block-jetpack-contact-form' ).waitFor();
	}
}
