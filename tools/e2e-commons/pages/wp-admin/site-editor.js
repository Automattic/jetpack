import WpPage from '../wp-page.js';
import logger from '../../logger.cjs';
import { resolveSiteUrl } from '../../helpers/utils-helper.cjs';
import { EditorCanvas } from './index.js';
import { expect } from '@playwright/test';

export default class SiteEditorPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/site-editor.php';
		super( page, { expectedSelectors: [ '#site-editor' ], url } );

		this.canvasPage = new EditorCanvas( page );
	}

	async clearCustomizations() {
		logger.step( 'Attempting clear customizations' );
		await this.click( "button[aria-label='Show template details']" );
		const clearCustomizationsBtn = 'span:text("Clear customizations")';
		if ( await this.isElementVisible( clearCustomizationsBtn, 1000 ) ) {
			logger.info( 'Clearing customizations' );
			await this.click( clearCustomizationsBtn );
		}
	}

	async searchForBlock( searchTerm ) {
		logger.step( `Search block: '${ searchTerm }'` );
		await this.click( '.edit-site-header-toolbar__inserter-toggle' );
		await this.fill( '.components-search-control__input', searchTerm );
	}

	async insertBlock( blockName, blockTitle ) {
		await this.searchForBlock( blockTitle );

		logger.step( `Insert block {name: ${ blockName }, title: ${ blockTitle }}` );
		await this.click( `.editor-block-list-item-jetpack-${ blockName }` );

		const blockElement = await this.canvasPage
			.canvas()
			.waitForSelector( `div[data-type='jetpack/${ blockName }']` );
		const blockId = await blockElement.getAttribute( 'data-block' );
		logger.info( `Block inserted: {name: ${ blockName }, id: ${ blockId }}` );
		await this.canvasPage.canvas().focus( `#block-${ blockId }` );
		return blockId;
	}

	async savePage() {
		const firstSaveBtnSelector = 'button.edit-site-save-button__button';
		logger.step( `Saving page` );
		await this.click( firstSaveBtnSelector );
		await this.waitForElementToBeVisible( "button:has-text('Cancel')" );
		await this.click( 'button.editor-entities-saved-states__save-button' );
		await expect( this.page.locator( firstSaveBtnSelector ) ).toBeDisabled();
	}

	async viewPage() {
		logger.step( `Viewing page` );
		await this.click( "button:has-text('View')" );

		const [ viewPageTab ] = await Promise.all( [
			this.page.context().waitForEvent( 'page' ),
			await this.click( "a:has-text('View site')" ),
		] );

		logger.action( 'Waiting for new page' );
		await viewPageTab.waitForLoadState();
		await viewPageTab.bringToFront();
		return viewPageTab;
	}
}
