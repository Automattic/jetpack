import PageActions from '../../page-actions.js';

export default class BlockEditorCanvas extends PageActions {
	constructor( page ) {
		super( page, 'BlockEditorCanvas', [ '.edit-post-visual-editor' ] );
	}
	canvas() {
		return this.page.frame( 'editor-canvas' ) || this.page;
	}
}
