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
	 * Anchor the feature sections link to.
	 */
	public const ANCHOR = 'jetpack-sharing-placement';

	/**
	 * Where a feature's buttons currently appear, stated inside that feature's
	 * own section.
	 *
	 * This setting governs both features but lives in neither, so each section
	 * says what it means for that feature and links here to change it. It also
	 * surfaces a placement that hides the buttons entirely, which is otherwise
	 * only visible on this section further down the page.
	 *
	 * @param string $feature Plural feature name, already translated.
	 */
	public static function render_summary( string $feature ): void {
		$labels = array_map( array( __CLASS__, 'label_for' ), self::selected_post_types() );

		if ( $labels === array() ) {
			$summary = sprintf(
				/* translators: %s: a feature name, for example "Like buttons". */
				__( '%s are currently not shown anywhere.', 'jetpack' ),
				$feature
			);
		} else {
			$summary = sprintf(
				/* translators: 1: a feature name, for example "Like buttons". 2: comma-separated list of places, for example "Posts, Pages". */
				__( '%1$s currently appear on: %2$s.', 'jetpack' ),
				$feature,
				implode( ', ', $labels )
			);
		}

		printf(
			'<p class="description">%1$s <a href="#%2$s">%3$s</a></p>',
			esc_html( $summary ),
			esc_attr( self::ANCHOR ),
			esc_html__( 'Change where they appear', 'jetpack' )
		);
	}

	/**
	 * Render the section.
	 */
	public static function render(): void {
		$shown = self::selected_post_types();

		$choices = array_values( get_post_types( array( 'public' => true ) ) );
		array_unshift( $choices, 'index' );
		?>
		<div class="jetpack-sharing-settings__section" id="<?php echo esc_attr( self::ANCHOR ); ?>">
			<h2><?php echo esc_html( self::heading() ); ?></h2>
			<form method="post" action="">
				<table class="form-table">
					<tbody>
					<?php
					/** This filter is documented in modules/sharedaddy/sharing.php */
					echo apply_filters( 'sharing_show_buttons_on_row_start', '<tr valign="top">' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
						<th scope="row"></th>
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
	 * Heading naming the features this section governs.
	 *
	 * "Show buttons on" sat directly below the Like buttons section and read as
	 * though it belonged to it. Naming the features makes the shared scope
	 * legible without a second line of copy.
	 */
	private static function heading(): string {
		$sharing = Environment::sharing_enabled();
		$likes   = Environment::likes_enabled();

		if ( $sharing && $likes ) {
			return __( 'Where sharing and Like buttons appear', 'jetpack' );
		}

		return $sharing
			? __( 'Where sharing buttons appear', 'jetpack' )
			: __( 'Where Like buttons appear', 'jetpack' );
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
