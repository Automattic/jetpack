<?php
/**
 * The Sharing buttons section of Settings > Sharing.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

/**
 * Renders the Sharing buttons section.
 *
 * Turning the Sharing module on and off belongs to the Jetpack dashboard; this
 * section only configures the buttons, and links there when they are off.
 */
final class Sharing_Section {

	/**
	 * Nonce action for this section's forms.
	 */
	public const NONCE_ACTION = 'jetpack-sharing-options';

	/**
	 * Render the section.
	 */
	public static function render(): void {
		$state = Section_State::for_section( self::can_offer_block(), Environment::sharing_enabled() );

		echo '<div class="jetpack-sharing-settings__section">';
		printf( '<h2>%s</h2>', esc_html_x( 'Sharing buttons', 'Settings header', 'jetpack' ) );

		switch ( $state ) {
			case Section_State::BLOCK_CALL_TO_ACTION:
				self::render_block_call_to_action();
				break;
			case Section_State::OFF:
				self::render_off();
				break;
			case Section_State::CONFIGURE_WITH_BLOCK_NUDGE:
				self::render_block_nudge();
				self::render_services_config();
				break;
			default:
				self::render_services_config();
		}

		echo '</div>';
	}

	/**
	 * Whether the Sharing Buttons block is a route we can send this site down.
	 */
	private static function can_offer_block(): bool {
		return Environment::is_block_theme()
			&& Environment::has_sharing_block()
			&& '' !== Environment::post_template_url();
	}

	/**
	 * The module is off and the site could use the block instead.
	 */
	private static function render_block_call_to_action(): void {
		printf(
			'<p>%s</p>',
			esc_html_x(
				'Add the Sharing Buttons block to your theme’s template.',
				'Sharing Buttons block migration instruction',
				'jetpack'
			)
		);
		self::render_site_editor_link();
	}

	/**
	 * The module is off on a theme with no block route.
	 *
	 * Nothing else on this site produces sharing buttons, so this is the one
	 * place the feature can be switched back on.
	 */
	private static function render_off(): void {
		printf(
			'<p>%s</p>',
			esc_html__( 'Sharing buttons are turned off for this site.', 'jetpack' )
		);

		if ( ! Environment::can_activate_modules() ) {
			printf(
				'<p>%s</p>',
				esc_html__( 'Connect your site to WordPress.com, or enable offline mode, to turn them back on.', 'jetpack' )
			);
			return;
		}

		Post_Handler::render_activate_form(
			'activate-sharing',
			self::NONCE_ACTION,
			__( 'Turn on sharing buttons', 'jetpack' )
		);
	}

	/**
	 * The buttons are live, but the site would be better served by the block.
	 */
	private static function render_block_nudge(): void {
		echo '<div class="notice notice-info inline"><p>';
		echo esc_html__( 'Legacy sharing buttons cannot be customized on block themes.', 'jetpack' );
		echo ' ';
		echo esc_html__( 'We recommend turning them off below and adding the Sharing Buttons block to your theme’s template instead.', 'jetpack' );
		echo '</p></div>';
		self::render_site_editor_link();
	}

	/**
	 * Link to the active theme's single post template, with the editor open.
	 */
	private static function render_site_editor_link(): void {
		printf(
			'<p><a class="button" href="%1$s">%2$s</a></p>',
			esc_url( Environment::post_template_url() ),
			esc_html__( 'Open Site Editor', 'jetpack' )
		);
	}

	/**
	 * The services list and its settings.
	 *
	 * Still rendered by `Sharing_Admin`, which owns the drag-and-drop UI, its
	 * AJAX handlers and the new-service form. Moving those here is the second
	 * half of CM-912.
	 */
	private static function render_services_config(): void {
		global $sharing_admin;

		if ( $sharing_admin instanceof \Sharing_Admin ) {
			$sharing_admin->services_config_display();
		}
	}
}
