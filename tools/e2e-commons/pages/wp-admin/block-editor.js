import { waitForBlock } from '../../helpers/blocks-helper.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import logger from '../../logger.js';
import WpPage from '../wp-page.js';
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
		await this.openSettings();
	}

	async waitForEditor() {
		await this.canvasPage.canvas().locator( "h1[aria-label='Add title']" ).waitFor();
	}

	/**
	 * Returns the editor top bar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor top bar locator.
	 */
	getEditorTopBar() {
		return this.page.getByRole( 'region', { name: 'Editor top bar' } );
	}

	/**
	 * Returns the editor settings sidebar locator.
	 *
	 * @return {import('@playwright/test').Locator} The editor settings sidebar locator.
	 */
	getEditorSettingsSidebar() {
		return this.page.getByRole( 'region', { name: 'Editor settings' } );
	}

	/**
	 * Returns the more options button instance.
	 *
	 * @return {import('@playwright/test').Locator} The more options button locator.
	 */
	getMoreOptionsButton() {
		return this.getEditorTopBar().getByRole( 'button', {
			name: 'Options',
			exact: true,
		} );
	}

	/**
	 * Given a Locator, determines whether the target button/toggle is
	 * in an expanded state.
	 *
	 * If the toggle is in the on state or otherwise in an expanded
	 * state, this method will return true. Otherwise, false.
	 *
	 * @param {import('@playwright/test').Locator} target - Target button.
	 * @return {Promise<boolean>} True if target is in an expanded state. False otherwise.
	 */
	async #targetIsOpen( target ) {
		const checked = await target.getAttribute( 'aria-checked' );
		const pressed = await target.getAttribute( 'aria-pressed' );
		const expanded = await target.getAttribute( 'aria-expanded' );
		return checked === 'true' || pressed === 'true' || expanded === 'true';
	}

	/* Editor Settings sidebar */

	/**
	 * Opens the editor settings.
	 *
	 * @param {string} target - The target to open. Can be 'Settings', 'Jetpack', 'Jetpack Social'.
	 */
	async openSettings( target = 'Settings' ) {
		let button = this.getEditorTopBar().getByLabel( target );

		// For other pinned settings, we need to open the options menu
		// because those are hidden on mobile/small screens
		if ( target !== 'Settings' ) {
			await this.openMoreOptionsMenu();

			button = this.page.getByRole( 'menuitemcheckbox', { name: target } );
		}

		if ( await this.#targetIsOpen( button ) ) {
			await this.closeMoreOptionsMenu();
			return;
		}

		await button.click();
	}

	/**
	 * Opens the more options menu (three dots).
	 */
	async openMoreOptionsMenu() {
		const button = this.getMoreOptionsButton();

		if ( await this.#targetIsOpen( button ) ) {
			return;
		}

		await button.click();
	}

	/**
	 * Closes the more options menu.
	 */
	async closeMoreOptionsMenu() {
		const button = this.getMoreOptionsButton();

		if ( await this.#targetIsOpen( button ) ) {
			await button.click();
		}
	}
}
