/**
 * Internal dependencies
 */
import { waitForSelector, waitAndClick } from '../page-helper';
/**
 * WordPress dependencies
 */
import { clickBlockToolbarButton } from '@wordpress/e2e-test-utils';

export default class WordAdsBlock {
	constructor( block, page ) {
		this.blockTitle = WordAdsBlock.title();
		this.block = block;
		this.page = page;
		this.blockSelector = '#block-' + block.clientId;
	}

	static name() {
		return 'wordads';
	}

	static title() {
		return 'Ad';
	}

	async switchFormat( buttonNumber ) {
		await clickBlockToolbarButton( 'Pick an ad format' );

		const formatButtonsSelector = '.wp-block-jetpack-wordads__format-picker button';
		await waitForSelector( this.page, formatButtonsSelector );
		const allButtons = await this.page.$$( formatButtonsSelector );
		await allButtons[ buttonNumber ].click();
	}

	getSelector( selector ) {
		return `${ this.blockSelector } ${ selector }`;
	}

	async focus() {
		return await waitAndClick( this.page, this.getSelector( '.wp-block-jetpack-wordads' ) );
	}

	/**
	 * Checks whether block is rendered on frontend
	 * @param {Page} page Puppeteer page instance
	 */
	static async isRendered( page ) {
		const containerSelector = ".entry-content iframe[src*='wordads']";

		await waitForSelector( page, containerSelector );
	}
}
