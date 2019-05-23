/**
 * Internal dependencies
 */
import { waitForSelector } from '../pageHelper';

export default class Page {
	constructor( page, { expectedSelector } ) {
		this.page = page;
		this.expectedSelector = expectedSelector;
		this.visit = false;
		this.url = null;
		this.name = this.constructor.name;
		this.explicitWaitMS = 25000;
	}

	static async init( page ) {
		const it = new this( page );
		await it.waitForPage();
		return it;
	}

	async waitForPage() {
		await this.page.waitForSelector( this.expectedSelector, { visible: true } );
		return await waitForSelector( this.page, this.expectedSelector, { visible: true } );
	}
}
