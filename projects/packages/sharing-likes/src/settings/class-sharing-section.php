<?php
/**
 * The Sharing buttons section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

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
		printf( '<h2>%s</h2>', esc_html_x( 'Sharing buttons', 'Settings header', 'jetpack-sharing-likes' ) );

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
				'jetpack-sharing-likes'
			)
		);
		self::render_site_editor_link();
		self::render_activate_form( false );
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
			esc_html__( 'Sharing buttons are turned off for this site.', 'jetpack-sharing-likes' )
		);

		self::render_activate_form();
	}

	/**
	 * The way back from either off variant.
	 *
	 * Recommending the block does not remove the need for this: the switch is a
	 * single unconfirmed click, and without a way back this screen would be a
	 * one-way door.
	 *
	 * @param bool $primary Whether this is the only action offered.
	 */
	private static function render_activate_form( bool $primary = true ): void {
		if ( ! Environment::can_activate_modules() ) {
			printf(
				'<p>%s</p>',
				esc_html__( 'Connect your site to WordPress.com, or enable offline mode, to turn them back on.', 'jetpack-sharing-likes' )
			);
			return;
		}

		Post_Handler::render_action_form(
			'activate-sharing',
			self::NONCE_ACTION,
			__( 'Turn on sharing buttons', 'jetpack-sharing-likes' ),
			$primary
		);
	}

	/**
	 * The buttons are live, but the site would be better served by the block.
	 */
	private static function render_block_nudge(): void {
		echo '<div class="notice notice-info inline">';
		printf( '<p>%s</p>', esc_html__( 'Legacy sharing buttons cannot be customized on block themes. Use the Sharing Buttons block in your theme’s template instead.', 'jetpack-sharing-likes' ) );

		/*
		 * Switching means turning the module off, which WordPress.com Simple has
		 * no equivalent for: there the site editor link is the only useful step.
		 */
		if ( Environment::is_simple_site() ) {
			self::render_site_editor_link();
		} else {
			Post_Handler::render_action_form(
				'switch-to-block-sharing',
				self::NONCE_ACTION,
				__( 'Switch to the Sharing Buttons block', 'jetpack-sharing-likes' ),
				false
			);
		}

		echo '</div>';
	}

	/**
	 * Link to the active theme's single post template, with the editor open.
	 */
	private static function render_site_editor_link(): void {
		printf(
			'<p><a class="button" href="%1$s">%2$s</a></p>',
			esc_url( Environment::post_template_url() ),
			esc_html__( 'Open Site Editor', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * The services list and its settings.
	 */
	private static function render_services_config(): void {
		Placement_Section::render_summary( Placement_Section::FEATURE_SHARING );

		( new Services_Config() )->render();
	}
}
