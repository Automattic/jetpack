/**
 * The dialog's host, a form control, so the dialog can live in a shadow root out
 * of the theme's reach and still post with the comment.
 */
export class DialogHost extends HTMLElement {
	static formAssociated = true;
	internals = this.attachInternals();
}
