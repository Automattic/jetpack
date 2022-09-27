import PageActions from '../../page-actions.js';

export default class WordAdsBlock extends PageActions {
	constructor( blockId, page ) {
		super( page, 'Ad block' );
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
		await this.click( '.wp-block-jetpack-wordads__format-picker-icon' );
		const formatButtonSelector = `.wp-block-jetpack-wordads__format-picker button:nth-child(${ buttonNumber })`;
		return await this.click( formatButtonSelector );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	async focus() {
		return await this.click( this.getSelector( '.wp-block-jetpack-wordads' ) );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		const containerSelector = 'article .wpa';
		await page.waitForSelector( containerSelector );
	}
}
