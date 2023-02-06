import PageActions from '../../page-actions.js';

export default class EditorCanvas extends PageActions {
	constructor( page ) {
		// selector(s) need to match both block editor and site editor, as this class is used in both
		super( page, 'EditorCanvas', [ "div[aria-label='Editor content']" ] );
	}
	canvas() {
		return this.page.frame( 'editor-canvas' ) || this.page;
	}
}
