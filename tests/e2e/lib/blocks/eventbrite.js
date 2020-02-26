/**
 * Internal dependencies
 */
import { waitForSelector, waitAndClick, waitAndType } from '../page-helper';

export default class EventbriteBlock {
	constructor( block, page ) {
		this.blockTitle = EventbriteBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'eventbrite';
	}

	static title() {
		return 'Eventbrite';
	}

	static embedUrl() {
		return 'https://www.eventbrite.co.nz/e/96820156695';
	}

	static eventUrl() {
		return 'https://www.eventbrite.co.nz/e/javascript-for-beginners-tickets-96820156695';
	}

	async addEmbed() {
		const inputSelector = this.getSelector( '.components-placeholder__input' );
		const descriptionSelector = this.getSelector( "button[type='submit']" );

		await waitAndClick( this.page, inputSelector );
		await waitAndType( this.page, inputSelector, EventbriteBlock.embedUrl() );

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
		const containerSelector = `.entry-content a[href='${ EventbriteBlock.eventUrl() }']`;

		await waitForSelector( page, containerSelector );
	}
}
