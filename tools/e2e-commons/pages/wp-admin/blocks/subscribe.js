import PageActions from '../../page-actions.js';

export default class SubscribeBlock extends PageActions {
	constructor( blockId, page ) {
		super( page, 'Subscribe' );
		this.blockTitle = SubscribeBlock.title();
		this.page = page;
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'subscriptions';
	}

	static title() {
		return 'Subscribe';
	}

	async checkBlock() {
		await this.page.waitForResponse(
			r =>
				decodeURIComponent( r.url() ).match( /wpcom\/v2\/subscribers\/counts/ ) &&
				r.status() === 200
		);
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.waitForSelector( '.wp-block-jetpack-subscriptions__container #subscribe-field-1' );
		await page.waitForSelector( '.wp-block-jetpack-subscriptions__container button' );
	}
}
