/**
 * Internal dependencies
 */
import WpPage from '../wp-page';
import logger from '../../logger';

export default class BlockEditorPage extends WpPage {
	constructor( page ) {
		const url = siteUrl + '/wp-admin/post-new.php';
		super( page, { expectedSelectors: [ '#editor' ], url } );
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
		return `${ this.postPublishBtnSel } a`;
	}

	get postTitleFldSel() {
		return '.editor-post-title__input';
	}

	//endregion

	async resolveWelcomeGuide( show = false ) {
		const isWelcomeGuideActive = await page.evaluate( () =>
			wp.data.select( 'core/edit-post' ).isFeatureActive( 'welcomeGuide' )
		);

		if ( show !== isWelcomeGuideActive ) {
			await page.evaluate( () =>
				wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' )
			);

			logger.step( `Refreshing page to reflect 'welcomeGuide' feature toggle` );
			await this.reload();
		}
	}

	async searchForBlock( searchTerm ) {
		logger.step( `Search block: '${ searchTerm }'` );
		await this.click( this.insertBlockBtnSel );
		await this.type( this.searchBlockFldSel, searchTerm );
	}

	async insertBlock( blockName, blockTitle ) {
		logger.step( `Insert block {name: ${ blockName }, title: ${ blockTitle }` );
		await this.searchForBlock( blockTitle );
		await this.click( this.blockSel( blockName ) );
		return await this.getInsertedBlock( blockName );
	}

	async getInsertedBlock( blockName ) {
		return (
			await this.waitForElementToBeVisible( this.insertedBlockSel( blockName ) )
		 ).getAttribute( 'data-block' );
	}

	async publishPost() {
		logger.step( `Publish post` );
		await this.click( this.publishPanelToggleBtnSel );
		await this.click( this.publishPostBtnSel );
		await this.waitForElementToBeVisible( this.postPublishViewPostBtnSel );
	}

	async viewPost() {
		logger.step( `View post` );
		await this.click( this.postPublishViewPostBtnSel );
	}

	async selectPostTitle() {
		await this.focus( this.postTitleFldSel );
		await this.click( this.postTitleFldSel );
	}

	async waitForAvailableBlock( blockSlug ) {
		let block = await this.findAvailableBlock( blockSlug );
		if ( block ) {
			return true;
		}
		let count = 0;
		while ( count < 20 && ! block ) {
			await this.waitForTimeout( 1000 ); // Trying to wait for plan data to be updated
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
