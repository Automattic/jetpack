import EditorCanvas from './editor-canvas.js';
export default class WordAdsBlock extends EditorCanvas {
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
		return await this.canvas().click( this.getSelector( '.wp-block-jetpack-wordads' ) );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		// We check for either the ads placeholder div, or the iframes if the ads are loaded.
		const containerSelector = ".entry-content iframe[src*='wordads'],main .wpa .wpa-about";
		await page.locator( containerSelector ).waitFor();
	}
}
