import { execContainerShellCommand } from '../../../helpers/utils-helper.cjs';
import PageActions from '../../page-actions.js';

export default class TiledGallery extends PageActions {
	constructor( blockId, page ) {
		super( page, 'Tiled Gallery block' );
		this.blockTitle = TiledGallery.title();
		this.blockSelector = '#block-' + blockId;
	}

	static name() {
		return 'tiled-gallery';
	}

	static title() {
		return 'Tiled Gallery';
	}

	async addImages() {
		console.log( '++++++++++++++++++++++++++++++++++++++++++++++++' );
		console.log( await execContainerShellCommand( 'pwd' ) );
		console.log( '================================================' );
		console.log( await execContainerShellCommand( 'stat wp-content/uploads/' ) );
		console.log( '================================================' );
		console.log( await execContainerShellCommand( 'stat wp-content/uploads/2022/12/' ) );
		console.log( '================================================' );
		console.log(
			await execContainerShellCommand( 'chown -R www-data:www-data wp-content/uploads' )
		);
		console.log( '================================================' );

		await this.click( this.#getSelector( 'button.jetpack-external-media-button-menu' ) );
		await this.click( 'text=Openverse' );
		const modal = this.page.getByRole( 'dialog' );

		await this.waitForElementToBeHidden( 'jetpack-external-media-browser__media__placeholder' );

		for ( let i = 0; i < 4; i++ ) {
			await modal.getByRole( 'checkbox' ).nth( i ).click();
		}

		await modal.getByRole( 'button', { name: 'Select' } ).click();

		modal.waitFor( { state: 'hidden' } );
	}

	async linkToAttachment() {
		await this.click( "button[data-label='Block']" );
		await this.selectOption( 'select.components-select-control__input', 'Attachment Page' );
		// await this.page.getByRole('button', { name: 'Block (selected)' }).click();
		// await this.page.getByRole('combobox', { name: 'Link To' }).selectOption('attachment');
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.waitForSelector( '???' );
	}

	#getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}
}
