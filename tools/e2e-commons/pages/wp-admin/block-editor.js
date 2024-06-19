import WpPage from '../wp-page.js';
import logger from '../../logger.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.js';
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
		return '.components-search-control__input';
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

	async closeWelcomeGuide() {
		const isWelcomeGuideVisible = await this.page
			.getByText( 'Welcome to the block editor', { exact: true } )
			.isVisible();

		if ( isWelcomeGuideVisible ) {
			logger.step( 'Closing welcome guide.' );
			await this.page.getByRole( 'button', { name: 'Close', exact: true } ).click();
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
		const blockElement = this.canvasPage.canvas().locator( this.insertedBlockSel( blockName ) );
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
		await this.canvasPage.canvas().locator( "h1[aria-label='Add title']" ).waitFor();
	}
}
