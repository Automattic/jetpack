import EditorCanvas from './editor-canvas.js';

export default class TiledGallery extends EditorCanvas {
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

	async addImages( numImages = 4 ) {
		await this.canvas().click( this.#getSelector( 'button.jetpack-external-media-button-menu' ) );
		await this.click( 'text=Openverse' );

		const modal = this.page.getByRole( 'dialog' );
		await this.waitForElementToBeHidden(
			'jetpack-external-media-browser__media__placeholder',
			6000
		);

		for ( let i = 0; i < numImages; i++ ) {
			await modal.getByRole( 'checkbox' ).nth( i ).click();
		}

		await modal.getByRole( 'button', { name: 'Select' } ).click();

		await modal.waitFor( { state: 'hidden' } );
		await this.waitForResponse();
	}

	async waitForResponse() {
		await this.page.waitForResponse(
			r => decodeURIComponent( r.url() ).match( /wp\/v2\/media/ ) && r.status() === 200
		);
	}

	async linkToAttachment() {
		const settingTabSelector = "button[role='tab'][aria-label='Settings']";
		if ( await this.isElementVisible( settingTabSelector, 5000 ) ) {
			await this.click( settingTabSelector );
		}
		await this.click( "button[data-label='Block']" );
		await this.selectOption( 'select.components-select-control__input', 'Attachment Page' );
	}

	/**
	 * Checks whether block is rendered on frontend
	 *
	 * @param {page} page Playwright page instance
	 */
	static async isRendered( page ) {
		await page.locator( '.tiled-gallery__gallery' ).waitFor();
	}

	#getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}
}
