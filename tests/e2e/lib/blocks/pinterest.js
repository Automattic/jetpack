/**
 * External dependencies
 */
import { waitForSelector, waitAndClick, waitAndType } from 'puppeteer-utils';

export default class PinterestBlock {
	constructor( block, page ) {
		this.blockTitle = PinterestBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'pinterest';
	}

	static title() {
		return 'Pinterest';
	}

	static embedUrl() {
		return 'https://www.pinterest.com/pin/180003316347175596/';
	}

	async addEmbed() {
		const inputSelector = this.getSelector( '.components-placeholder__input' );
		const descriptionSelector = this.getSelector( "button[type='submit']" );

		await waitAndClick( this.page, inputSelector );
		await waitAndType( this.page, inputSelector, PinterestBlock.embedUrl() );

		await waitAndClick( this.page, descriptionSelector );
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	/**
	 * Checks whether block is rendered on frontend
	 * @param {Page} page Puppeteer page instance
	 */
	static async isRendered( page ) {
		const containerSelector = `.entry-content a[data-pin-do='embedPin'][href='${ PinterestBlock.embedUrl() }']`;

		await waitForSelector( page, containerSelector );
	}
}
