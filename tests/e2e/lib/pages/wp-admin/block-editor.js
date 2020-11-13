/**
 * Internal dependencies
 */
import Page from '../page';
/**
 * WordPress dependencies
 */
import { getAllBlocks, searchForBlock } from '@wordpress/e2e-test-utils';
import { scrollIntoView, waitForSelector } from '../../page-helper';
import { getNgrokSiteUrl } from '../../utils-helper';

export default class BlockEditorPage extends Page {
	constructor( page ) {
		const expectedSelector = '#editor';
		const url = getNgrokSiteUrl() + '/wp-admin/post-new.php';
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

	async insertBlock( blockName, blockTitle ) {
		await searchForBlock( blockTitle );
		const blockIconSelector = `.editor-block-list-item-jetpack-${ blockName }`;
		await scrollIntoView( this.page, blockIconSelector );

		await page.click( blockIconSelector );
		const blockInfo = await this.getInsertedBlock();
		return blockInfo;
	}

	async getInsertedBlock() {
		const blocks = await getAllBlocks();
		return blocks[ blocks.length - 1 ];
	}

	async publishPost() {
		await page.click( '.editor-post-publish-panel__toggle' );

		// Disable reason: Wait for the animation to complete, since otherwise the
		// click attempt may occur at the wrong point.
		// Also, for some reason post-publish bar wont show up it we click to fast :/
		await page.waitForTimeout( 500 );

		await page.click( '.editor-post-publish-button' );
		return await waitForSelector( this.page, '.post-publish-panel__postpublish-buttons a' );
	}

	async viewPost() {
		await waitForSelector( this.page, '.post-publish-panel__postpublish-buttons a' );
		await page.click( '.post-publish-panel__postpublish-buttons a' );
	}

	async focus() {
		await this.page.focus( this.expectedSelector );
		await page.click( '.editor-post-title__input' );
	}

	async waitForAvailableBlock( blockSlug ) {
		let block = await this.findAvailableBlock( blockSlug );
		if ( block ) {
			return true;
		}
		let count = 0;
		while ( count < 20 && ! block ) {
			await this.page.waitForTimeout( 1000 ); // Trying to wait for plan data to be updated
			await this.reload( { waitFor: 'networkidle' } );
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
