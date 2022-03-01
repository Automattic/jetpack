import WpPage from '../wp-page.js';

export default class ThemesPage extends WpPage {
	constructor( page ) {
		super( page, { expectedSelectors: [ '.search-form' ] } );
	}

	async activateTheme( themeSlug ) {
		const selector = `div[data-slug='${ themeSlug }'] a[href*='=activate']`;
		await this.click( selector );
		await this.waitForLoad();
	}
}
