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
		$hook = add_submenu_page(
			'options-general.php',
			__( 'Sharing Settings', 'jetpack' ),
			__( 'Sharing', 'jetpack' ),
			'manage_options',
			self::SLUG,
			array( __CLASS__, 'render_in_wrapper' )
		);

		if ( $hook ) {
			add_action( 'admin_print_styles-' . $hook, array( __CLASS__, 'enqueue_styles' ) );
		}
	}

	/**
	 * Styles for the Jetpack chrome this screen renders inside.
	 *
	 * Jetpack_Admin_Page::wrap_ui() emits the masthead and footer markup but does
	 * not style them, and this screen exists whether or not a module is loaded
	 * to do it for us. WordPress.com Simple styles that chrome itself, and these
	 * sheets are served from a plugin URL it does not have.
	 */
	public static function enqueue_styles(): void {
		if ( Environment::is_simple_site() ) {
			return;
		}

		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Render the screen inside Jetpack's admin chrome.
	 */
	public static function render_in_wrapper(): void {
		Jetpack_Admin_Page::wrap_ui( array( __CLASS__, 'render' ), array( 'is-wide' => true ) );
	}

	/**
	 * Render whichever sections apply, ruled off from one another.
	 *
	 * Each section is its own form with its own save button, so the boundary
	 * says which settings a given save covers.
	 */
	private static function render_sections(): void {
		$sections = array(
			array( Sharing_Section::class, 'render' ),
			array( Likes_Section::class, 'render' ),
		);

		if ( Section_State::shows_placement( Environment::sharing_enabled(), Environment::likes_settings_in_use() ) ) {
			$sections[] = array( Placement_Section::class, 'render' );
		}

		if ( ! Environment::sharing_enabled() ) {
			$sections[] = array( Extras_Section::class, 'render' );
		}

		$rendered = 0;

		foreach ( $sections as $section ) {
			ob_start();
			call_user_func( $section );
			$markup = trim( (string) ob_get_clean() );

			// A section can decline to render, and a rule with nothing after it is worse than no rule.
			if ( '' === $markup ) {
				continue;
			}

			if ( $rendered > 0 ) {
				echo '<hr />';
			}

			echo $markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- each section escapes its own output.
			++$rendered;
		}
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

			self::render_sections();
			?>
		</div>
		<?php
	}
}
