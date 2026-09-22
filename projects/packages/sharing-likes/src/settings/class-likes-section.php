<?php
/**
 * The Like buttons section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Renders the Like buttons section.
 */
final class Likes_Section {

	/**
	 * Nonce action for this section's action buttons.
	 *
	 * Deliberately not sharedaddy's `sharing-options`: that nonce triggers the
	 * sharing handlers too, and one of them clears `sharing-options[global][show]`
	 * when the request carries no `show` field.
	 */
	public const NONCE_ACTION = 'jetpack-likes-options';

	/**
	 * Anchor `jetpack_likes_configuration_url()` points the module list at.
	 */
	public const ANCHOR = 'likes';

	/**
	 * Render the section.
	 */
	public static function render(): void {
		printf( '<div class="jetpack-sharing-settings__section" id="%s">', esc_attr( self::ANCHOR ) );
		printf( '<h2>%s</h2>', esc_html_x( 'Like buttons', 'Settings header', 'jetpack-sharing-likes' ) );

		if ( ! Environment::likes_supported() ) {
			self::render_unsupported();
			echo '</div>';
			return;
		}

		// Off with a block route points at the block; off without one offers the way
		// back. Running with a route shows the options under a nudge; running without, the options alone.
		switch ( self::state() ) {
			case Section_State::BLOCK_CALL_TO_ACTION:
				self::render_block_call_to_action();
				break;
			case Section_State::OFF:
				self::render_off();
				break;
			case Section_State::CONFIGURE_WITH_BLOCK_NUDGE:
				self::render_block_nudge();
				self::render_options();
				break;
			default:
				self::render_options();
		}

		echo '</div>';
	}

	/**
	 * Which variant the section renders.
	 *
	 * @return string One of the `Section_State` constants.
	 */
	public static function state(): string {
		return Section_State::for_section(
			self::can_offer_block(),
			Environment::likes_settings_in_use(),
			Environment::legacy_likes_switched_off()
		);
	}

	/**
	 * Like buttons cannot render on this site at all.
	 *
	 * The section still says so rather than vanishing: the per-post Likes
	 * metabox stays visible on a disconnected site, and someone following it
	 * here should learn why there is nothing to configure.
	 */
	private static function render_unsupported(): void {
		printf(
			'<p>%s</p>',
			esc_html__( 'Like buttons need a connection to WordPress.com. Connect your site to turn them on and choose where they appear.', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * Whether the Like block is a route we can send this site down.
	 *
	 * A block theme alone is not enough. All of these must hold too:
	 * - the block is registered;
	 * - the theme has a single post template to add it to;
	 * - Comment Likes is not running as a module, since comments have no block to
	 *   move to. Simple has no module to switch off, so it is exempt.
	 */
	private static function can_offer_block(): bool {
		return Environment::is_block_theme()
			&& Environment::like_block_registered()
			&& ( Environment::is_simple_site() || ! Environment::comment_likes_module_running() )
			&& '' !== Environment::single_template_editor_url();
	}

	/**
	 * The legacy buttons are off and the site could use the block instead.
	 */
	private static function render_block_call_to_action(): void {
		printf(
			'<p>%s</p>',
			esc_html__( 'Add the Like block to your theme’s template.', 'jetpack-sharing-likes' )
		);
		self::render_site_editor_link();

		if ( Environment::is_simple_site() ) {
			self::render_comment_likes_form();
		}
	}

	/**
	 * The module is off on a theme with no block route.
	 */
	private static function render_off(): void {
		printf(
			'<p>%s</p>',
			esc_html__( 'Like buttons are turned off for this site.', 'jetpack-sharing-likes' )
		);
		self::render_activate_form();
	}

	/**
	 * The way back. See `Post_Handler::activate_module()`.
	 */
	private static function render_activate_form(): void {
		Post_Handler::render_action_form(
			'activate-likes',
			self::NONCE_ACTION,
			__( 'Turn on Like buttons', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * The buttons are live, but the site would be better served by the block.
	 */
	private static function render_block_nudge(): void {
		echo '<div class="notice notice-info inline">';
		printf( '<p>%s</p>', esc_html__( 'Legacy Like buttons cannot be customized on block themes. Use the Like block in your theme’s template instead.', 'jetpack-sharing-likes' ) );
		Post_Handler::render_action_form(
			'switch-to-block-likes',
			self::NONCE_ACTION,
			__( 'Switch to the Like block', 'jetpack-sharing-likes' ),
			false
		);
		echo '</div>';
	}

	/**
	 * Link to the active theme's single post template, with the editor open.
	 */
	private static function render_site_editor_link(): void {
		printf(
			'<p><a class="button" href="%1$s">%2$s</a></p>',
			esc_url( Environment::single_template_editor_url() ),
			esc_html__( 'Open Site Editor', 'jetpack-sharing-likes' )
		);
	}

	/**
	 * The section's own settings.
	 */
	private static function render_options(): void {
		Placement_Section::render_summary( Placement_Section::FEATURE_LIKES );

		$likes_enabled_sitewide = Likes_Options::likes_enabled_sitewide();

		ob_start();
		?>
		<table class="form-table">
			<tbody>
				<tr>
					<th scope="row"><label><?php esc_html_e( 'WordPress.com Likes are', 'jetpack-sharing-likes' ); ?></label></th>
					<td>
						<div>
							<label>
								<input type="radio" name="wpl_default" value="on" <?php checked( $likes_enabled_sitewide ); ?> />
								<?php esc_html_e( 'On for all posts', 'jetpack-sharing-likes' ); ?>
							</label>
						</div>
						<div>
							<label>
								<input type="radio" name="wpl_default" value="off" <?php checked( ! $likes_enabled_sitewide ); ?> />
								<?php esc_html_e( 'Turned on per post', 'jetpack-sharing-likes' ); ?>
							</label>
						</div>
					</td>
				</tr>
				<?php
				if ( Environment::is_simple_site() ) {
					self::render_reblog_option();
				}
				?>
			</tbody>
		</table>
		<?php
		if ( Environment::is_simple_site() ) {
			self::render_comment_likes_option();
		}

		Settings_Form::render_fields( Settings_Form::SECTION_LIKES, (string) ob_get_clean() );
	}

	/**
	 * Reblog button, WordPress.com Simple only.
	 *
	 * Moves to the Like block's own settings once a site switches: the block
	 * carries a `showReblogButton` attribute.
	 */
	private static function render_reblog_option(): void {
		$enabled = Likes_Options::reblogs_enabled_sitewide();
		?>
		<tr>
			<th scope="row"><label><?php esc_html_e( 'WordPress.com Reblog Button', 'jetpack-sharing-likes' ); ?></label></th>
			<td>
				<div>
					<label>
						<input type="radio" name="jetpack_reblogs_enabled" value="on" <?php checked( $enabled ); ?> />
						<?php esc_html_e( 'Show the Reblog button on posts', 'jetpack-sharing-likes' ); ?>
					</label>
				</div>
				<div>
					<label>
						<input type="radio" name="jetpack_reblogs_enabled" value="off" <?php checked( ! $enabled ); ?> />
						<?php esc_html_e( 'Don\'t show the Reblog button on posts', 'jetpack-sharing-likes' ); ?>
					</label>
				</div>
			</td>
		</tr>
		<?php
	}

	/**
	 * Comment Likes on their own, for a Simple site whose post Likes moved to the block.
	 */
	private static function render_comment_likes_form(): void {
		ob_start();
		self::render_comment_likes_option();
		Settings_Form::render_fields( Settings_Form::SECTION_COMMENT_LIKES, (string) ob_get_clean() );
	}

	/**
	 * Comment Likes, WordPress.com Simple only.
	 *
	 * Rendered outside the post-likes table because it is unaffected by the
	 * block: comments have no Like block to move to.
	 */
	private static function render_comment_likes_option(): void {
		?>
		<table class="form-table">
			<tbody>
				<tr>
					<th scope="row"><label><?php esc_html_e( 'Comment Likes are', 'jetpack-sharing-likes' ); ?></label></th>
					<td>
						<label>
							<input type="checkbox" name="jetpack_comment_likes_enabled" value="1" <?php checked( Likes_Options::comment_likes_enabled() ); ?> />
							<?php esc_html_e( 'On for all comments', 'jetpack-sharing-likes' ); ?>
						</label>
					</td>
				</tr>
			</tbody>
		</table>
		<?php
	}
}
