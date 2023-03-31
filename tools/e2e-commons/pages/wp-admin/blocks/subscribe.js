import EditorCanvas from './editor-canvas.js';
import { expect } from '@playwright/test';
export default class SubscribeBlock extends EditorCanvas {
	constructor( blockId, page ) {
		super( page, 'Subscribe' );
		this.blockTitle = SubscribeBlock.title();
		this.page = page;
	}
	static name() {
		return 'subscriptions';
	}

	static title() {
		return 'Subscribe';
	}
	async insertBlock( editorPage ) {
		const responsePromise = this.page.waitForResponse(
			r =>
				decodeURIComponent( decodeURIComponent( r.url() ) ).match(
					/wpcom\/v2\/subscribers\/counts/
				),
			{ timeout: 30000 }
		);
		const blockId = await editorPage.insertBlock( SubscribeBlock.name(), SubscribeBlock.title() );
		const response = await responsePromise;

		expect( response.ok(), 'Response status should be ok' ).toBeTruthy();

		this.blockId = blockId;
		return blockId;
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
