import '../css/deactivation.scss';

export default class DeactivationDialog {
	private deactivateButton: HTMLAnchorElement;
	private dialog: HTMLDivElement;

	static CLOSE_EVENT = 'deactivationDialog:close';
	static DEACTIVATE_EVENT = 'deactivationDialog:deactivate';

	static events = {
		close: new Event( DeactivationDialog.CLOSE_EVENT, { bubbles: true } ),
		deactivate: new CustomEvent( DeactivationDialog.DEACTIVATE_EVENT, {
			bubbles: true,
			detail: { feedback: false },
		} ),
		deactivateWithFeedback: new CustomEvent( DeactivationDialog.DEACTIVATE_EVENT, {
			bubbles: true,
			detail: { feedback: true },
		} ),
	};

	constructor( private pluginSlug: string, private feedbackUrl: string ) {
		this.deactivateButton = document.getElementById(
			`deactivate-${ this.pluginSlug }`
		) as HTMLAnchorElement;
		this.dialog = document.getElementById(
			`jb-deactivation-${ this.pluginSlug }`
		) as HTMLDivElement;

		if ( ! this.deactivateButton ) {
			return;
		}

		this.attachEventListeners();

		this.deactivateButton.addEventListener( `click`, event => {
			event.preventDefault();
			this.showDialog();
		} );
	}

	showDialog() {
		this.dialog.classList.add( 'active' );
	}

	hideDialog() {
		this.dialog.classList.remove( 'active' );
	}

	attachEventListeners() {
		this.dialog.addEventListener( DeactivationDialog.CLOSE_EVENT, () => this.hideDialog() );
		this.dialog.addEventListener( DeactivationDialog.DEACTIVATE_EVENT, event =>
			this.deactivate( event )
		);
	}

	deactivate( event ) {
		if ( ! this.deactivateButton ) {
			return;
		}

		if ( event.detail.feedback ) {
			window.open( this.feedbackUrl, '_blank' );
		}
		window.location.href = this.deactivateButton.href;
		this.hideDialog();
	}
}
