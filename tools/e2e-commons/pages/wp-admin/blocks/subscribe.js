import EditorCanvas from './editor-canvas.js';
import { expect } from '@playwright/test';
export default class SubscribeBlock extends EditorCanvas {
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
		const response = await this.page.waitForResponse(
			r => decodeURIComponent( r.url() ).match( /wpcom\/v2\/subscribers\/counts/ ),
			{ timeout: 30000 }
		);
		expect( response.status(), 'Response status should be 200' ).toBe( 200 );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {Object} frontendPage PageActions page instance
	 */
	async isRenderedInFrontend( frontendPage ) {
		await frontendPage.waitForElementToBeVisible(
			".wp-block-jetpack-subscriptions__container input[name='email']"
		);
		await frontendPage.waitForElementToBeVisible(
			'.wp-block-jetpack-subscriptions__container button'
		);
		return true;
	}
}
