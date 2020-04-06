/**
 * Internal dependencies
 */
import { waitForSelector, waitAndClick, waitAndType } from '../page-helper';

export default class PinterestBlock {
	constructor( block, page, pinId ) {
		this.blockTitle = PinterestBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
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

		await waitAndClick( this.page, inputSelector );
		await waitAndType( this.page, inputSelector, this.embedUrl() );
		await waitAndClick( this.page, descriptionSelector );
		await waitForSelector( this.page, '.wp-block-jetpack-pinterest .components-sandbox' );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 * @param {Page} page Puppeteer page instance
	 * @param {Object} args An object of any additional required instance values
	 */
	static async isRendered( page, args ) {
		const containerSelector = `.entry-content span[data-pin-id='${ args.pinId }']`;

		await waitForSelector( page, containerSelector );
	}
}
