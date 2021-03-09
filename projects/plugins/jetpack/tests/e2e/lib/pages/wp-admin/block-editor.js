/**
 * Internal dependencies
 */
import Page from '../page';
import { getTunnelSiteUrl } from '../../utils-helper';

export default class BlockEditorPage extends Page {
	constructor( page ) {
		const expectedSelector = '#editor';
		const url = getTunnelSiteUrl() + '/wp-admin/post-new.php';
		super( page, { expectedSelector, url } );
	}

	static async init( page, showWelcomeGuide = false ) {
		const it = await super.init( page );

		const isWelcomeGuideActive = await page.evaluate( () =>
			wp.data.select( 'core/edit-post' ).isFeatureActive( 'welcomeGuide' )
		);

		if ( showWelcomeGuide !== isWelcomeGuideActive ) {
			await page.evaluate( () =>
				wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' )
			);

			await it.reload();
		}

		return it;
	}

	//region selectors

	get insertBlockBtnSel() {
		return '.edit-post-header-toolbar__inserter-toggle';
	}

	get searchBlockFldSel() {
		return '.block-editor-inserter__search-input';
	}

	blockSel( blockName ) {
		return `.editor-block-list-item-jetpack-${ blockName }`;
	}

	insertedBlockSel( blockName ) {
		return `div[data-type='jetpack/${ blockName }']`;
	}

	get publishPanelToggleBtnSel() {
		return '.editor-post-publish-panel__toggle';
	}

	get publishPostBtnSel() {
		return '.editor-post-publish-button';
	}

	get postPublishBtnSel() {
		return '.post-publish-panel__postpublish-buttons';
	}

	get postPublishViewPostBtnSel() {
		// return `${ this.postPublishBtnSel } a`;
		return '.post-publish-panel__postpublish-buttons a';
	}

	get postTitleFldSel() {
		return '.editor-post-title__input';
	}

	//endregion

	async searchForBlock( searchTerm ) {
		await this.page.click( this.insertBlockBtnSel );
		await this.page.type( this.searchBlockFldSel, searchTerm );
	}

	async insertBlock( blockName, blockTitle ) {
		await this.searchForBlock( blockTitle );
		await this.page.click( this.blockSel( blockName ) );
		return await this.getInsertedBlock( blockName );
	}

	async getInsertedBlock( blockName ) {
		return ( await this.page.waitForSelector( this.insertedBlockSel( blockName ) ) ).getAttribute(
			'data-block'
		);
	}

	async publishPost() {
		await this.page.click( this.publishPanelToggleBtnSel );
		await this.page.click( this.publishPostBtnSel );
		await this.page.waitForSelector( this.postPublishViewPostBtnSel );
	}

	async viewPost() {
		await this.page.click( this.postPublishViewPostBtnSel );
	}

	async selectPostTitle() {
		await this.page.focus( this.postTitleFldSel );
		await this.page.click( this.postTitleFldSel );
	}

	async waitForAvailableBlock( blockSlug ) {
		let block = await this.findAvailableBlock( blockSlug );
		if ( block ) {
			return true;
		}
		let count = 0;
		while ( count < 20 && ! block ) {
			await this.page.waitForTimeout( 1000 ); // Trying to wait for plan data to be updated
			await this.reload( { waitUntil: 'domcontentloaded' } );
			block = await this.findAvailableBlock( blockSlug );
			count += 1;
		}
	}

	async findAvailableBlock( blockSlug ) {
		const allBlocks = await this.getAllAvailableBlocks();
		return allBlocks.find( b => b.includes( blockSlug ) );
	}

	async getAllAvailableBlocks() {
		return await this.page.evaluate( () =>
			wp.data
				.select( 'core/blocks' )
				.getBlockTypes()
				.map( b => b.name )
		);
	}
}
