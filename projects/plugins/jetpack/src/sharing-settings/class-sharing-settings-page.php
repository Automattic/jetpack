<?php
/**
 * The Settings > Sharing screen.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

use Jetpack_Admin_Page;

/**
 * Registers Settings > Sharing and renders its sections.
 *
 * Registration does not depend on any module being active, so the screen and
 * every section on it exist whatever the site is running.
 */
final class Sharing_Settings_Page {

	/**
	 * Submenu slug. Unchanged from when sharedaddy registered this screen, so
	 * existing links and bookmarks keep working.
	 */
	public const SLUG = 'sharing';

	/**
	 * Hook the screen up.
	 */
	public static function init(): void {
		add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
	}

	/**
	 * Add the submenu entry under Settings.
	 */
	public static function register_menu(): void {
		add_submenu_page(
			'options-general.php',
			__( 'Sharing Settings', 'jetpack' ),
			__( 'Sharing', 'jetpack' ),
			'manage_options',
			self::SLUG,
			array( __CLASS__, 'render_in_wrapper' )
		);
	}

	/**
	 * Render the screen inside Jetpack's admin chrome.
	 */
	public static function render_in_wrapper(): void {
		Jetpack_Admin_Page::wrap_ui( array( __CLASS__, 'render' ), array( 'is-wide' => true ) );
	}

	/**
	 * Confirm a save, when one just happened.
	 */
	private static function render_saved_notice(): void {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only decides whether to print a confirmation.
		if ( ! isset( $_GET['update'] ) || 'saved' !== $_GET['update'] ) {
			return;
		}

		printf(
			'<div class="updated"><p>%s</p></div>',
			esc_html__( 'Settings have been saved', 'jetpack' )
		);
	}

	/**
	 * Render the screen.
	 */
	public static function render(): void {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Sharing Settings', 'jetpack' ); ?></h1>
			<?php
			self::render_saved_notice();

			/** This action is documented in modules/sharedaddy/sharing.php */
			do_action( 'pre_admin_screen_sharing' );

			Sharing_Section::render();

			if ( Environment::likes_supported() ) {
				Likes_Section::render();
			}

			if ( Section_State::shows_placement( Environment::sharing_enabled(), Environment::likes_enabled() ) ) {
				Placement_Section::render();
			}
			?>
		</div>
		<?php
	}
}
