import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';
import { waitForBlock } from '../../helpers/blocks-helper.js';
import { EditorCanvas } from './index.js';

export default class BlockEditorPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/post-new.php';
		super( page, { expectedSelectors: [ '#editor' ], url } );

		this.canvasPage = new EditorCanvas( page );
	}

	//region selectors

	get insertBlockBtnSel() {
		return '.edit-post-header-toolbar__inserter-toggle';
	}

	get searchBlockFldSel() {
		// There are 2 classes here because the class changed in Gutenberg 11.2 but is not yet in the WP bundled version.
		//TODO: to remove .block-editor-inserter__search-input once WP will include GB version 11.2
		return '.components-search-control__input,.block-editor-inserter__search-input';
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
		const isWelcomeGuideActive = await this.page.evaluate( () =>
			wp.data.select( 'core/edit-post' ).isFeatureActive( 'welcomeGuide' )
		);

		if ( show !== isWelcomeGuideActive ) {
			await this.page.evaluate( () =>
				wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'welcomeGuide' )
			);

			logger.step( `Refreshing page to reflect 'welcomeGuide' feature toggle` );
			await this.reload();
		}
	}

	async searchForBlock( searchTerm ) {
		logger.step( `Search block: '${ searchTerm }'` );
		await this.click( this.insertBlockBtnSel );
		await this.fill( this.searchBlockFldSel, searchTerm );
	}

	async insertBlock( blockName, blockTitle ) {
		await waitForBlock( blockName, this );
		await this.searchForBlock( blockTitle );

		logger.step( `Insert block {name: ${ blockName }, title: ${ blockTitle }}` );
		await this.click( this.blockSel( blockName ) );
		return await this.getInsertedBlock( blockName );
	}

	async getInsertedBlock( blockName ) {
		const blockElement = await this.canvasPage
			.canvas()
			.waitForSelector( this.insertedBlockSel( blockName ) );
		return blockElement.getAttribute( 'data-block' );
	}

	async setTitle( title ) {
		await this.selectPostTitle();
		await this.canvasPage.canvas().fill( this.postTitleFldSel, title );
	}

	async publishPost() {
		logger.step( `Publish post` );
		await this.click( '.editor-post-save-draft' );
		await this.waitForElementToBeVisible( '.editor-post-saved-state.is-saved' );
		await this.click( this.publishPanelToggleBtnSel );
		// Wait for animation :shrug:
		await this.waitForTimeout( 100 );
		await this.click( this.publishPostBtnSel );
		await this.waitForElementToBeVisible( this.postPublishViewPostBtnSel );
	}

	async viewPost() {
		logger.step( `View post` );
		await this.click( this.postPublishViewPostBtnSel );
	}

	async selectPostTitle() {
		await this.canvasPage.canvas().focus( this.postTitleFldSel );
		await this.canvasPage.canvas().click( this.postTitleFldSel );
	}

	async openSettingsSidebar() {
		const settingsLocator = 'button[aria-label="Settings"][aria-pressed="false"]';

		if ( await this.isElementVisible( settingsLocator ) ) {
			await this.click( settingsLocator );
		}
	}

	async waitForEditor() {
		await this.canvasPage.canvas().waitForSelector( "h1[aria-label='Add title']" );
	}
}
