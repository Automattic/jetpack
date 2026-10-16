<?php
/**
 * Loads the scripts that registered integrations supply their UI from.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

use Automattic\Jetpack\Forms\Dashboard\Dashboard;

/**
 * Enqueues each available integration's `editor_script` and `dashboard_script`.
 *
 * The integrations modal renders from a bundle inside this package, so an integration that
 * ships elsewhere needs its own script on the page to register a card. Declaring the handle at
 * registration means the integration does not have to know which screens the modal appears on,
 * or hook them itself.
 *
 * The handle must already be registered with wp_register_script(); this only enqueues it.
 */
class Integration_Assets {

	/**
	 * The Forms block editor script. A card is registered against the same registry the
	 * bundle reads, so ordering only matters to the extent that a plugin's script should not
	 * be parsed before the bundle it augments.
	 */
	private const EDITOR_HANDLE = 'jp-forms-blocks';

	/**
	 * Start enqueuing integration scripts.
	 *
	 * @return void
	 */
	public static function init() {
		// Priority 11: after Contact_Form_Block::load_editor_scripts() has registered the
		// Forms editor bundle at priority 9, so it can be depended on.
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_scripts' ), 11 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_dashboard_scripts' ), 11 );
	}

	/**
	 * Enqueue integration scripts in the block editor.
	 *
	 * @return void
	 */
	public static function enqueue_editor_scripts() {
		self::enqueue_for( 'editor_script', self::EDITOR_HANDLE );
	}

	/**
	 * Enqueue integration scripts on the Forms dashboard.
	 *
	 * @return void
	 */
	public static function enqueue_dashboard_scripts() {
		if ( ! Dashboard::is_jetpack_forms_admin_page() ) {
			return;
		}

		// The wp-build dashboard is a script module, which a classic script cannot be a
		// dependency of. Nothing is added here: registrations go onto a queue the dashboard
		// drains when it renders, so a classic script that runs earlier is still seen.
		self::enqueue_for( 'dashboard_script', null );
	}

	/**
	 * Enqueue one declared handle for every available integration.
	 *
	 * @param string      $key       Registration key holding the handle.
	 * @param string|null $dependency Handle the script should load after, or null for none.
	 * @return void
	 */
	private static function enqueue_for( $key, $dependency ) {
		Built_In_Integrations::register();

		foreach ( Integration_Registry::available() as $slug => $args ) {
			$handle = isset( $args[ $key ] ) ? $args[ $key ] : null;

			if ( ! $handle || ! is_string( $handle ) ) {
				continue;
			}

			if ( ! wp_script_is( $handle, 'registered' ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: script handle, 2: integration slug. */
						esc_html__( 'The script "%1$s" declared by the "%2$s" integration is not registered. Register it with wp_register_script() before Jetpack Forms enqueues it.', 'jetpack-forms' ),
						esc_html( $handle ),
						esc_html( $slug )
					),
					'jetpack-forms-$$next-version$$'
				);
				continue;
			}

			// Add the dependency for the integration rather than requiring every plugin to
			// know the Forms handle. Declaring it themselves is still fine; this is a no-op
			// when it is already there.
			if ( $dependency && wp_script_is( $dependency, 'registered' ) ) {
				$registered = wp_scripts()->registered[ $handle ];

				if ( ! in_array( $dependency, $registered->deps, true ) ) {
					$registered->deps[] = $dependency;
				}
			}

			wp_enqueue_script( $handle );
		}
	}
}
