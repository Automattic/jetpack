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
	 * Render whichever sections apply, ruled off from one another, then the
	 * one Save button that covers them all.
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

		$sharing_state = Sharing_Section::state();

		if ( Section_State::shows_placement( $sharing_state, Likes_Section::state() ) ) {
			$sections[] = array( Placement_Section::class, 'render' );
		}

		if ( ! Section_State::configures( $sharing_state ) ) {
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

		Settings_Form::render();
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
	 * Warn when PHP has no mbstring extension.
	 *
	 * Sharing sources fall back to byte-wise string functions without it, which
	 * can cut multibyte text mid-character when a service truncates it.
	 */
	private static function render_multibyte_warning(): void {
		if ( function_exists( 'mb_stripos' ) ) {
			return;
		}

		printf(
			'<div class="notice notice-warning"><p><strong>%1$s</strong></p><p>%2$s</p></div>',
			esc_html__( 'Warning! Multibyte support missing!', 'jetpack-sharing-likes' ),
			wp_kses(
				sprintf(
					/* translators: placeholder is a link to a PHP support document. */
					__( 'This plugin will work without it, but multibyte support is used <a href="%s" rel="noopener noreferrer" target="_blank">if available</a>. You may see minor problems with Tweets and other sharing services.', 'jetpack-sharing-likes' ),
					'https://www.php.net/manual/en/mbstring.installation.php'
				),
				array(
					'a' => array(
						'href'   => array(),
						'rel'    => array(),
						'target' => array(),
					),
				)
			)
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
			self::render_multibyte_warning();
			self::render_saved_notice();

			/**
			 * Fires at the top of the admin sharing settings screen.
			 *
			 * @module sharedaddy
			 *
			 * @since jetpack-1.6.0
			 */
			do_action( 'pre_admin_screen_sharing' );

			self::render_sections();
			?>
		</div>
		<?php
	}
}
