/**
 * Internal dependencies
 */
import Page from '../page';
/**
 * WordPress dependencies
 */
import { getAllBlocks, searchForBlock } from '@wordpress/e2e-test-utils';
import { waitAndClick, waitForSelector, scrollIntoView } from '../../page-helper';
import { getNgrokSiteUrl } from '../../utils-helper';

export default class BlockEditorPage extends Page {
	constructor( page ) {
		const expectedSelector = '.block-editor';
		const url = getNgrokSiteUrl() + '/wp-admin/post-new.php';
		super( page, { expectedSelector, url } );
	}

	async insertBlock( blockName, blockTitle ) {
		await searchForBlock( blockTitle );
		const blockIconSelector = `.editor-block-list-item-jetpack-${ blockName }`;
		const jetpackPanelSelector = '.components-panel__body .jetpack-logo';
		await scrollIntoView( this.page, jetpackPanelSelector );
		await waitAndClick( this.page, blockIconSelector );
		const blockInfo = await this.getInsertedBlock();
		return blockInfo;
	}

	async getInsertedBlock() {
		const blocks = await getAllBlocks();
		return blocks[ blocks.length - 1 ];
	}

	async publishPost() {
		await waitAndClick( this.page, '.editor-post-publish-panel__toggle' );

		// Disable reason: Wait for the animation to complete, since otherwise the
		// click attempt may occur at the wrong point.
		// Also, for some reason post-publish bar wont show up it we click to fast :/
		await page.waitFor( 500 );

		await waitAndClick( this.page, '.editor-post-publish-button' );
		return await waitForSelector( this.page, '.post-publish-panel__postpublish-buttons a' );
	}

	async viewPost() {
		await waitForSelector( this.page, '.post-publish-panel__postpublish-buttons a' );
		await waitAndClick( this.page, '.post-publish-panel__postpublish-buttons a' );
	}

	async focus() {
		await this.page.focus( this.expectedSelector );
		await waitAndClick( this.page, '.editor-post-title__input' );
	}
}
