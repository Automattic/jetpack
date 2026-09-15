<?php
/**
 * The shared placement section of Settings > Sharing.
 *
 * @package automattic/jetpack
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Plugin\Sharing_Settings;

/**
 * Renders "Show buttons on", which governs where both sharing buttons and Like
 * buttons appear. Its own section because it belongs to neither feature alone.
 */
final class Placement_Section {

	/**
	 * Nonce action for this section's form.
	 */
	public const NONCE_ACTION = 'jetpack-sharing-placement';

	/**
	 * Render the section.
	 */
	public static function render(): void {
		$shown = self::selected_post_types();

		$choices = array_values( get_post_types( array( 'public' => true ) ) );
		array_unshift( $choices, 'index' );
		?>
		<div class="jetpack-sharing-settings__section">
			<h2><?php esc_html_e( 'Show buttons on', 'jetpack' ); ?></h2>
			<form method="post" action="">
				<table class="form-table">
					<tbody>
					<?php
					/** This filter is documented in modules/sharedaddy/sharing.php */
					echo apply_filters( 'sharing_show_buttons_on_row_start', '<tr valign="top">' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
						<th scope="row"><label><?php esc_html_e( 'Show buttons on', 'jetpack' ); ?></label></th>
						<td>
							<?php foreach ( $choices as $choice ) : ?>
								<label>
									<input type="checkbox" name="show[]" value="<?php echo esc_attr( $choice ); ?>" <?php checked( in_array( $choice, $shown, true ) ); ?> />
									<?php echo esc_html( self::label_for( $choice ) ); ?>
								</label><br />
							<?php endforeach; ?>
						</td>
					<?php
					/** This filter is documented in modules/sharedaddy/sharing.php */
					echo apply_filters( 'sharing_show_buttons_on_row_end', '</tr>' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
					</tbody>
				</table>
				<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack' ); ?>" />
					<?php
					Post_Handler::render_action_field( 'save-placement' );
					wp_nonce_field( self::NONCE_ACTION );
					?>
				</p>
			</form>
		</div>
		<?php
	}

	/**
	 * Post types currently set to show buttons.
	 *
	 * @return string[]
	 */
	private static function selected_post_types(): array {
		$sharing = get_option( 'sharing-options', array() );
		$shown   = is_array( $sharing ) && isset( $sharing['global']['show'] ) ? $sharing['global']['show'] : array();

		// Pre-2.x sites stored a single keyword rather than a list.
		if ( is_scalar( $shown ) ) {
			$legacy = array(
				'posts'       => array( 'post', 'page' ),
				'index'       => array( 'index' ),
				'posts-index' => array( 'post', 'page', 'index' ),
			);
			$shown  = $legacy[ $shown ] ?? array();
		}

		return (array) $shown;
	}

	/**
	 * Human-readable label for a post type choice.
	 *
	 * @param string $choice Post type slug, or 'index' for the archive pages.
	 */
	private static function label_for( string $choice ): string {
		if ( 'index' === $choice ) {
			return __( 'Front Page, Archive Pages, and Search Results', 'jetpack' );
		}

		$post_type = get_post_type_object( $choice );

		return $post_type instanceof \WP_Post_Type ? $post_type->labels->name : $choice;
	}
}
