/**
 * Internal dependencies
 */
import Page from './page';

export default class PostFrontendPage extends Page {
	constructor( page ) {
		const expectedSelector = '#main article.post';
		super( page, { expectedSelector } );
	}

	/**
	 * Checks whether specific block is rendered on frontend. All the custom logic is defined in block's `isRendered` static method
	 * @param {Class} BlockClass Block class that has a static `isRendered` method
	 */
	async isRenderedBlockPresent( BlockClass ) {
		return await BlockClass.isRendered( this.page );
	}
}
