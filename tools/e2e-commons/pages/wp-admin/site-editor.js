import WpPage from '../wp-page.js';
import logger from '../../logger.js';
import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import { waitForBlock } from '../../helpers/blocks-helper.js';
import { EditorCanvas } from './index.js';
import { expect } from '@playwright/test';
import { SitePage } from '../index.js';

export default class SiteEditorPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/site-editor.php';
		super( page, { expectedSelectors: [ '#site-editor' ], url } );

		this.canvasPage = new EditorCanvas( page );
	}

	async edit() {
		const editBtnSelector = 'button.edit-site-site-hub__edit-button';
		if ( await this.isElementVisible( editBtnSelector, 2000 ) ) {
			await this.click( editBtnSelector );
		}
	}

	async clearCustomizations() {
		logger.step( 'Attempting clear customizations' );
		await this.waitForNoticeToDisappear();
		await this.click( "button[aria-label='Show template details']" );
		const clearCustomizationsBtn = 'span:text("Clear customizations")';
		if ( await this.isElementVisible( clearCustomizationsBtn, 1000 ) ) {
			logger.info( 'Clearing customizations' );
			await this.click( clearCustomizationsBtn );
			await this.waitForNoticeToAppear();
			await this.savePage();
		}
	}

	async closeWelcomeGuide() {
		const isWelcomeGuideActive = await this.page.evaluate( () =>
			wp.data.select( 'core/edit-site' ).isFeatureActive( 'welcomeGuide' )
		);

		if ( isWelcomeGuideActive ) {
			logger.step( 'Closing the welcome guide modal' );
			await this.page.evaluate( () => {
				wp.data.dispatch( 'core/edit-site' ).toggleFeature( 'welcomeGuide' );
				wp.data.dispatch( 'core/edit-site' ).toggleFeature( 'welcomeGuideStyles' );
			} );
		}
	}

	async searchForBlock( searchTerm ) {
		logger.step( `Search block: '${ searchTerm }'` );
		await this.click( "button[aria-label='Toggle block inserter']" );
		await this.fill( '.components-search-control__input', searchTerm );
	}

	async insertBlock( blockName, blockTitle ) {
		await waitForBlock( blockName, this );
		await this.searchForBlock( blockTitle );

		logger.step( `Insert block {name: ${ blockName }, title: ${ blockTitle }}` );
		await this.click( `.editor-block-list-item-jetpack-${ blockName }` );

		const blockElement = this.canvasPage
			.canvas()
			.locator( `div[data-type='jetpack/${ blockName }']` );
		const blockId = await blockElement.getAttribute( 'data-block' );
		logger.info( `Block inserted: {name: ${ blockName }, id: ${ blockId }}` );
		await this.canvasPage.canvas().focus( `#block-${ blockId }` );
		return blockId;
	}

	async savePage() {
		const firstSaveBtnSelector = 'button.edit-site-save-button__button';
		logger.step( `Saving page` );
		await this.waitForNoticeToDisappear();
		await this.click( firstSaveBtnSelector );
		await this.waitForElementToBeVisible( "button:has-text('Cancel')" );
		await this.click( 'button.editor-entities-saved-states__save-button' );
		await this.waitForNoticeToAppear();
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
		const sitePage = await SitePage.init( viewPageTab );
		await sitePage.page.bringToFront();
		return sitePage;
	}

	async waitForNoticeToAppear() {
		await this.waitForElementToBeVisible( '.components-snackbar__content' );
	}

	async waitForNoticeToDisappear() {
		await this.waitForElementToBeHidden( '.components-snackbar__content' );
	}
}
