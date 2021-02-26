import { clickBlockToolbarButton } from '@wordpress/e2e-test-utils';

export default class WordAdsBlock {
	constructor( blockId, page ) {
		this.blockTitle = WordAdsBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'wordads';
	}

	static title() {
		return 'Ad';
	}

	async switchFormat( buttonNumber ) {
		await clickBlockToolbarButton( 'Pick an ad format' );

		const formatButtonSelector = `.wp-block-jetpack-wordads__format-picker button:nth-child(${ buttonNumber })`;
		await this.page.waitForSelector( formatButtonSelector );
		await this.page.waitForTimeout( 500 );
		return await this.page.click( formatButtonSelector );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	async focus() {
		return await this.page.click( this.getSelector( '.wp-block-jetpack-wordads' ) );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		const containerSelector = ".entry-content iframe[src*='wordads']";

		await page.waitForSelector( containerSelector );
	}
}
