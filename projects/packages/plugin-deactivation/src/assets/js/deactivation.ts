import '../css/deactivation.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class JetpackPluginDeactivation {
	private deactivateButton: HTMLAnchorElement;
	private dialog: HTMLDivElement;

	static CLOSE_EVENT = 'deactivationDialog:close';
	static DEACTIVATE_EVENT = 'deactivationDialog:deactivate';
	static ACTIVE_CLASS_NAME = 'jp-plugin-deactivation--active';

	static events = {
		close: new Event( JetpackPluginDeactivation.CLOSE_EVENT, { bubbles: true } ),
		deactivate: new Event( JetpackPluginDeactivation.DEACTIVATE_EVENT, { bubbles: true } ),
	};

	constructor( private pluginSlug: string ) {
		this.deactivateButton = document.getElementById(
			`deactivate-${ this.pluginSlug }`
		) as HTMLAnchorElement;
		this.dialog = document.getElementById(
			`jp-plugin-deactivation-${ this.pluginSlug }`
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
		this.dialog.classList.add( JetpackPluginDeactivation.ACTIVE_CLASS_NAME );
	}

	hideDialog() {
		this.dialog.classList.remove( JetpackPluginDeactivation.ACTIVE_CLASS_NAME );
	}

	attachEventListeners() {
		this.dialog.addEventListener( JetpackPluginDeactivation.CLOSE_EVENT, () => this.hideDialog() );
		this.dialog.addEventListener( JetpackPluginDeactivation.DEACTIVATE_EVENT, () =>
			this.deactivate()
		);
	}

	deactivate() {
		if ( ! this.deactivateButton ) {
			return;
		}

		window.location.href = this.deactivateButton.href;
		this.hideDialog();
	}
}
