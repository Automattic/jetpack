import WpPage from '../wp-page';

export default class HomePage extends WpPage {
	constructor( page ) {
		const expectedSelector = 'body';
		const url = 'https://jetpack.com/redirect/?source=wpcom';
		super( page, { expectedSelectors: [ expectedSelector ], url } );
	}
}
