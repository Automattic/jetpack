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
		// The Like buttons section already explains what a disconnected site is missing.
		if ( ! Environment::likes_supported() ) {
			return;
		}

		printf( '<div class="jetpack-sharing-settings__section" id="%s">', esc_attr( self::ANCHOR ) );
		printf( '<h2>%s</h2>', esc_html_x( 'Comment Likes', 'Settings header', 'jetpack-sharing-likes' ) );

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
		// With Like buttons running, their own section already shows the default.
		$shows_default = Environment::comment_likes_follow_likes_settings() && ! Environment::likes_module_running();

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
