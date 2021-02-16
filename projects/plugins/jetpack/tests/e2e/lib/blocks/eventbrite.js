export default class EventbriteBlock {
	constructor( blockId, page, eventId ) {
		this.blockTitle = EventbriteBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
		this.eventId = eventId;
	}

	static name() {
		return 'eventbrite';
	}

	static title() {
		return 'Eventbrite';
	}

	embedUrl() {
		return `https://www.eventbrite.co.nz/e/${ this.eventId }`;
	}

	async addEmbed() {
		const inputSelector = this.getSelector( '.components-placeholder__input' );
		const descriptionSelector = this.getSelector( "button[type='submit']" );

		await this.page.type( inputSelector, this.embedUrl() );
		await this.page.click( descriptionSelector );
		await this.page.waitForSelector( '.wp-block-jetpack-eventbrite .components-sandbox' );
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
		const containerSelector = `.entry-content iframe[data-automation='checkout-widget-iframe-${ args.eventId }']`;

		await page.waitForSelector( containerSelector );
	}
}
