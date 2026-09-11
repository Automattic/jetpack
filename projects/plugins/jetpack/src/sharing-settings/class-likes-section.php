<?php
/**
 * The Like buttons section of Settings > Sharing.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

/**
 * Renders the Like buttons section.
 *
 * Turning the Likes module on and off belongs to the Jetpack dashboard; this
 * section only configures the buttons, and links there when they are off.
 */
final class Likes_Section {

	/**
	 * Nonce action for this section's form.
	 *
	 * Deliberately not sharedaddy's `sharing-options`: that nonce triggers the
	 * sharing handlers too, and one of them clears `sharing-options[global][show]`
	 * when the request carries no `show` field.
	 */
	public const NONCE_ACTION = 'jetpack-likes-options';

	/**
	 * Render the section.
	 */
	public static function render(): void {
		$state = Section_State::for_section( self::can_offer_block(), Environment::likes_enabled() );

		echo '<div class="jetpack-sharing-settings__section">';
		printf( '<h2>%s</h2>', esc_html_x( 'Like buttons', 'Settings header', 'jetpack' ) );

		switch ( $state ) {
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
	 * Whether the Like block is a route we can send this site down.
	 *
	 * A block theme alone is not enough: without the block or a resolvable
	 * template there is nowhere to send anyone, so those sites keep the
	 * classic behaviour.
	 */
	private static function can_offer_block(): bool {
		return Environment::is_block_theme()
			&& Environment::has_like_block()
			&& '' !== Environment::post_template_url();
	}

	/**
	 * The module is off and the site could use the block instead.
	 */
	private static function render_block_call_to_action(): void {
		printf(
			'<p>%s</p>',
			esc_html_x(
				'Add the Like block to your theme’s template.',
				'Like block migration instruction',
				'jetpack'
			)
		);
		self::render_site_editor_link();
	}

	/**
	 * The module is off on a theme with no block route.
	 *
	 * The Like block is not an option here, so this is the one place the
	 * feature can be switched back on.
	 */
	private static function render_off(): void {
		printf(
			'<p>%s</p>',
			esc_html__( 'Like buttons are turned off for this site.', 'jetpack' )
		);
		Post_Handler::render_activate_form(
			'activate-likes',
			self::NONCE_ACTION,
			__( 'Turn on Like buttons', 'jetpack' )
		);
	}

	/**
	 * The buttons are live, but the site would be better served by the block.
	 */
	private static function render_block_nudge(): void {
		echo '<div class="notice notice-info inline"><p>';
		echo esc_html__( 'Legacy Like buttons cannot be customized on block themes.', 'jetpack' );
		echo ' ';
		echo esc_html__( 'We recommend turning them off below and adding the Like block to your theme’s template instead.', 'jetpack' );
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
	 * The section's own settings.
	 */
	private static function render_options(): void {
		$enabled_sitewide = Likes_Options::enabled_sitewide();
		?>
		<form method="post" action="">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><label><?php esc_html_e( 'WordPress.com Likes are', 'jetpack' ); ?></label></th>
						<td>
							<div>
								<label>
									<input type="radio" name="wpl_default" value="on" <?php checked( $enabled_sitewide ); ?> />
									<?php esc_html_e( 'On for all posts', 'jetpack' ); ?>
								</label>
							</div>
							<div>
								<label>
									<input type="radio" name="wpl_default" value="off" <?php checked( ! $enabled_sitewide ); ?> />
									<?php esc_html_e( 'Turned on per post', 'jetpack' ); ?>
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
			?>
			<p class="submit">
				<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack' ); ?>" />
				<?php wp_nonce_field( self::NONCE_ACTION ); ?>
			</p>
		</form>
		<?php
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
			<th scope="row"><label><?php esc_html_e( 'WordPress.com Reblog Button', 'jetpack' ); ?></label></th>
			<td>
				<div>
					<label>
						<input type="radio" name="jetpack_reblogs_enabled" value="on" <?php checked( $enabled ); ?> />
						<?php esc_html_e( 'Show the Reblog button on posts', 'jetpack' ); ?>
					</label>
				</div>
				<div>
					<label>
						<input type="radio" name="jetpack_reblogs_enabled" value="off" <?php checked( ! $enabled ); ?> />
						<?php esc_html_e( 'Don\'t show the Reblog button on posts', 'jetpack' ); ?>
					</label>
				</div>
			</td>
		</tr>
		<?php
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
					<th scope="row"><label><?php esc_html_e( 'Comment Likes are', 'jetpack' ); ?></label></th>
					<td>
						<label>
							<input type="checkbox" name="jetpack_comment_likes_enabled" value="1" <?php checked( Likes_Options::comment_likes_enabled() ); ?> />
							<?php esc_html_e( 'On for all comments', 'jetpack' ); ?>
						</label>
					</td>
				</tr>
			</tbody>
		</table>
		<?php
	}
}
