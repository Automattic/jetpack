<?php
/**
 * The Settings > Sharing screen.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Registers Settings > Sharing and renders its sections.
 *
 * Registration does not depend on any module being active, so the screen and
 * every section on it exist whatever the site is running.
 */
final class Settings_Page {

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
			__( 'Sharing Settings', 'jetpack-sharing-likes' ),
			__( 'Sharing', 'jetpack-sharing-likes' ),
			'manage_options',
			self::SLUG,
			array( __CLASS__, 'render' )
		);
	}

	/**
	 * Render whichever sections apply, ruled off from one another.
	 *
	 * Each section is its own form with its own save button, so the boundary
	 * says which settings a given save covers.
	 */
	private static function render_sections(): void {
		// The submenu registers against this too. Repeated here because the sections
		// mint the nonces that authorise every save, and the screen is public API.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

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
			esc_html__( 'Settings have been saved', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * Render the screen.
	 */
	public static function render(): void {
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Sharing Settings', 'jetpack-sharing-likes' ); ?></h1>
			<?php
			self::render_saved_notice();

			/**
			 * Fires at the top of the admin sharing settings screen.
			 *
			 * @module sharedaddy
			 *
			 * @since 1.6.0
			 */
			do_action( 'pre_admin_screen_sharing' );

			self::render_sections();
			?>
		</div>
		<?php
	}
}
