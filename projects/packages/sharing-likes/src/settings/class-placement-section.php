<?php
/**
 * The shared placement section of Settings > Sharing.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\Settings;

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
	 * Identifies the Sharing buttons section to `render_summary()`.
	 */
	public const FEATURE_SHARING = 'sharing';

	/**
	 * Identifies the Like buttons section to `render_summary()`.
	 */
	public const FEATURE_LIKES = 'likes';

	/**
	 * Where a feature's buttons currently appear, stated inside that feature's
	 * own section.
	 *
	 * This setting governs both features but lives in neither, so each section
	 * says what it means for that feature and links here to change it. It also
	 * surfaces a placement that hides the buttons entirely, which is otherwise
	 * only visible on this section further down the page.
	 *
	 * Each feature gets a complete sentence: interpolating the feature name into
	 * a shared one does not translate.
	 *
	 * @param string $feature One of the FEATURE_* constants.
	 */
	public static function render_summary( string $feature ): void {
		$labels = array_map( array( __CLASS__, 'label_for' ), self::selected_post_types() );

		if ( $labels === array() ) {
			$summary = self::FEATURE_LIKES === $feature
				? __( 'Like buttons are currently not shown anywhere.', 'jetpack-sharing-likes' )
				: __( 'Sharing buttons are currently not shown anywhere.', 'jetpack-sharing-likes' );
		} elseif ( self::FEATURE_LIKES === $feature ) {
			/* translators: %s: comma-separated list of places, for example "Posts, Pages". */
			$summary = sprintf( __( 'Like buttons currently appear on: %s.', 'jetpack-sharing-likes' ), implode( ', ', $labels ) );
		} else {
			/* translators: %s: comma-separated list of places, for example "Posts, Pages". */
			$summary = sprintf( __( 'Sharing buttons currently appear on: %s.', 'jetpack-sharing-likes' ), implode( ', ', $labels ) );
		}

		printf(
			'<p class="description">%1$s <a href="#%2$s">%3$s</a></p>',
			esc_html( $summary ),
			esc_attr( self::ANCHOR ),
			esc_html__( 'Change where they appear', 'jetpack-sharing-likes' )
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
					/**
					 * Filters the HTML at the beginning of the "Show button on" row.
					 *
					 * @module sharedaddy
					 *
					 * @since 2.1.0
					 *
					 * @param string $var Opening HTML tag at the beginning of the "Show button on" row.
					 */
					echo apply_filters( 'sharing_show_buttons_on_row_start', '<tr valign="top">' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
						<th scope="row"></th>
						<td>
							<fieldset>
								<legend class="screen-reader-text"><span><?php echo esc_html( self::heading() ); ?></span></legend>
								<?php foreach ( $choices as $choice ) : ?>
									<label>
										<input type="checkbox" name="show[]" value="<?php echo esc_attr( $choice ); ?>" <?php checked( in_array( $choice, $shown, true ) ); ?> />
										<?php echo esc_html( self::label_for( $choice ) ); ?>
									</label><br />
								<?php endforeach; ?>
							</fieldset>
						</td>
					<?php
					/**
					 * Filters the HTML at the end of the "Show button on" row.
					 *
					 * @module sharedaddy
					 *
					 * @since 2.1.0
					 *
					 * @param string $var Closing HTML tag at the end of the "Show button on" row.
					 */
					echo apply_filters( 'sharing_show_buttons_on_row_end', '</tr>' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
					</tbody>
				</table>
				<p class="submit">
					<input type="submit" name="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jetpack-sharing-likes' ); ?>" />
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
		$likes   = Environment::likes_settings_in_use();

		if ( $sharing && $likes ) {
			return __( 'Where sharing and Like buttons appear', 'jetpack-sharing-likes' );
		}

		return $sharing
			? __( 'Where sharing buttons appear', 'jetpack-sharing-likes' )
			: __( 'Where Like buttons appear', 'jetpack-sharing-likes' );
	}

	/**
	 * Post types currently set to show buttons.
	 *
	 * Falls back to the same defaults the features themselves apply when the
	 * option has never been saved. Reading it raw would render every checkbox
	 * unchecked on a site where the buttons are in fact live, and the next save
	 * would then write that back and turn them off.
	 *
	 * @return string[]
	 */
	public static function selected_post_types(): array {
		$sharing = get_option( 'sharing-options', array() );

		if ( ! is_array( $sharing ) || ! isset( $sharing['global']['show'] ) ) {
			return self::default_post_types();
		}

		return self::normalize_show( $sharing['global']['show'] );
	}

	/**
	 * A stored `show` value as a list of post types.
	 *
	 * Pre-2.x sites stored a single keyword rather than a list, and both
	 * `Sharing_Service::get_global_options()` and `Jetpack_Likes_Settings::get_options()`
	 * still map it, so it is live data rather than a historical curiosity.
	 *
	 * @param mixed $shown Stored `sharing-options['global']['show']` value.
	 * @return string[]
	 */
	public static function normalize_show( $shown ): array {
		if ( is_scalar( $shown ) ) {
			$legacy = array(
				'posts'       => array( 'post', 'page' ),
				'index'       => array( 'index' ),
				'posts-index' => array( 'post', 'page', 'index' ),
			);
			$shown  = $legacy[ $shown ] ?? array();
		}

		return array_values( array_filter( (array) $shown, 'is_string' ) );
	}

	/**
	 * Where buttons appear on a site that has never saved this section.
	 *
	 * The two features disagree: sharing defaults to posts and pages, Likes adds
	 * public commentable custom post types. Reporting the narrower set would
	 * understate where Like buttons are, so defer to Likes whenever it is the
	 * feature running.
	 *
	 * @return string[]
	 */
	private static function default_post_types(): array {
		$defaults = array( 'post', 'page' );

		if ( ! Environment::likes_settings_in_use() ) {
			return $defaults;
		}

		if ( ! class_exists( 'Jetpack_Likes_Settings' ) ) {
			return $defaults;
		}

		$options = ( new \Jetpack_Likes_Settings() )->get_options();

		return isset( $options['show'] ) ? self::normalize_show( $options['show'] ) : $defaults;
	}

	/**
	 * Human-readable label for a post type choice.
	 *
	 * @param string $choice Post type slug, or 'index' for the archive pages.
	 */
	private static function label_for( string $choice ): string {
		if ( 'index' === $choice ) {
			return __( 'Front Page, Archive Pages, and Search Results', 'jetpack-sharing-likes' );
		}

		$post_type = get_post_type_object( $choice );

		return $post_type instanceof \WP_Post_Type ? $post_type->labels->name : $choice;
	}
}
