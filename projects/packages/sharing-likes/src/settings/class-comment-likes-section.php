<?php
/**
 * The Comment Likes section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

/**
 * Renders the Comment Likes section.
 *
 * Comment Likes run whether the Like buttons are on, off, or replaced by the
 * block, and comments have no block to move to, so this section has no variants.
 */
final class Comment_Likes_Section {

	/**
	 * Anchor for the section.
	 */
	public const ANCHOR = 'comment-likes';

	/**
	 * Render the section.
	 */
	public static function render(): void {
		printf( '<div class="jetpack-sharing-settings__section" id="%s">', esc_attr( self::ANCHOR ) );
		printf( '<h2>%s</h2>', esc_html_x( 'Comment Likes', 'Settings header', 'jetpack-sharing-likes' ) );

		// The module requires a connection, so offline mode gets no switch that would do nothing.
		if ( ! Environment::likes_supported() ) {
			printf(
				'<p>%s</p>',
				esc_html__( 'Comment Likes need a connection to WordPress.com. Connect your site to turn them on.', 'jetpack-sharing-likes' )
			);
			echo '</div>';
			return;
		}

		if ( Environment::comment_likes_follow_likes_settings() ) {
			Placement_Section::render_summary( Placement_Section::FEATURE_COMMENT_LIKES );
		}

		self::render_fields();

		echo '</div>';
	}

	/**
	 * The on/off switch, plus the sitewide Likes default when nothing else on the screen shows it.
	 *
	 * The switch is Simple's option, or the module on Atomic and Jetpack sites.
	 */
	private static function render_fields(): void {
		$shows_default = Environment::comment_likes_follow_likes_settings()
			&& ! Section_State::configures( Likes_Section::state() );

		ob_start();
		?>
		<table class="form-table">
			<tbody>
				<tr>
					<th scope="row"></th>
					<td>
						<label>
							<input type="checkbox" name="jetpack_comment_likes_enabled" value="1" <?php checked( Environment::comment_likes_enabled() ); ?> />
							<?php esc_html_e( 'Allow readers to like individual comments', 'jetpack-sharing-likes' ); ?>
						</label>
					</td>
				</tr>
				<?php
				if ( $shows_default ) {
					Likes_Section::render_sitewide_default_row( __( 'Comment Likes are', 'jetpack-sharing-likes' ) );
				}
				?>
			</tbody>
		</table>
		<?php
		Settings_Form::render_fields( Settings_Form::SECTION_COMMENT_LIKES, (string) ob_get_clean() );

		if ( $shows_default ) {
			// The default saves through the Like buttons handler, which only runs for a claimed section.
			Settings_Form::render_fields( Settings_Form::SECTION_LIKES, '' );
		}
	}
}
