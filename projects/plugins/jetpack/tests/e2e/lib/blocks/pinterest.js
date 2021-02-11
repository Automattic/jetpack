export default class PinterestBlock {
	constructor( blockId, page, pinId ) {
		this.blockTitle = PinterestBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
		this.pinId = pinId;
	}

	static name() {
		return 'pinterest';
	}

	static title() {
		return 'Pinterest';
	}

	embedUrl() {
		return `https://www.pinterest.com/pin/${ this.pinId }/`;
	}

	async addEmbed() {
		const inputSelector = this.getSelector( '.components-placeholder__input' );
		const descriptionSelector = this.getSelector( "button[type='submit']" );

		await this.page.type( inputSelector, this.embedUrl() );
		await this.page.click( descriptionSelector );
		await this.page.waitForSelector( '.wp-block-jetpack-pinterest .components-sandbox' );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 * @param {Object} args An object of any additional required instance values
	 */
	static async isRendered( page, args ) {
		const containerSelector = `.entry-content span[data-pin-id='${ args.pinId }']`;

		await page.waitForSelector( containerSelector );
	}
}
