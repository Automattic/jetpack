import '../css/deactivation.scss';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default class JetpackPluginDeactivation {
	private deactivateButton: HTMLElement;
	private dialog: HTMLDivElement;

	static ACTIVE_CLASS_NAME = 'jp-plugin-deactivation--active';

	constructor( private pluginSlug: string ) {
		this.deactivateButton = document.getElementById( `deactivate-${ this.pluginSlug }` );

		// When using jetpack beta, the id is postfixed with `-dev`.
		if ( ! this.deactivateButton ) {
			this.deactivateButton = document.getElementById( `deactivate-${ this.pluginSlug }-dev` );
		}

		// If the button is still not found, we're probably in a different page.
		if ( ! this.deactivateButton ) {
			return;
		}

		this.dialog = document.getElementById(
			`jp-plugin-deactivation-${ this.pluginSlug }`
		) as HTMLDivElement;

		this.observeDialogActions();
		this.attachEventListeners();
	}

	showDialog() {
		this.dialog.classList.add( JetpackPluginDeactivation.ACTIVE_CLASS_NAME );
	}

	hideDialog() {
		this.dialog.classList.remove( JetpackPluginDeactivation.ACTIVE_CLASS_NAME );
	}

	/**
	 * Look for clicks in elements of the dialog and trigger events accordingly.
	 */
	private observeDialogActions() {
		const closeActions = this.dialog.querySelectorAll(
			'[data-jp-plugin-deactivation-action="close"]'
		);

		closeActions.forEach( action => {
			action.addEventListener( 'click', () => {
				this.hideDialog();
			} );
		} );

		const deactivateActions = this.dialog.querySelectorAll(
			'[data-jp-plugin-deactivation-action="deactivate"]'
		);

		deactivateActions.forEach( action => {
			action.addEventListener( 'click', () => {
				this.deactivate();
			} );
		} );
	}

	private attachEventListeners() {
		// Intercept the plugin deactivation link click.
		this.deactivateButton.addEventListener( `click`, event => {
			event.preventDefault();
			this.showDialog();
		} );
	}

	deactivate() {
		if ( ! this.deactivateButton ) {
			return;
		}

		window.location.href = this.deactivateButton.href;
		this.hideDialog();
	}
}

type PluginDeactivation = {
	slugs: string[];
	instances: Record< string, JetpackPluginDeactivation >;
};

if ( 'JetpackPluginDeactivationData' in window ) {
	const plugins = window.JetpackPluginDeactivationData as PluginDeactivation;
	document.addEventListener( 'DOMContentLoaded', function () {
		if ( ! plugins.instances ) {
			plugins.instances = {};
		}

		for ( const plugin of plugins.slugs ) {
			plugins.instances[ plugin ] = new JetpackPluginDeactivation( plugin );
		}
	} );
}
