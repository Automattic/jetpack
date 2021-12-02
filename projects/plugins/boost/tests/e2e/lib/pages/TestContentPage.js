import WpPage from 'jetpack-e2e-commons/pages/wp-page.js';
import { findPostIdByTitle } from '../../helpers/common-helper.js';
import { resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';

export default class TestContentPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.post' ] } );
	}

	static async visitByTitle( title, page, checkSelectors = true ) {
		const it = new this( page );
		const postId = await findPostIdByTitle( title );
		it.url = `${ resolveSiteUrl() }/?p=${ postId }`;

		await it.goto( it.url );

		return this.init( page, checkSelectors );
	}
}
