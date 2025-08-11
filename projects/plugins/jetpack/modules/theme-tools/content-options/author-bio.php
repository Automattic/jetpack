<?php
/**
 * Theme Tools: Author Bio functions.
 *
 * @package automattic/jetpack
 */

if ( ! function_exists( 'jetpack_author_bio' ) ) {

	/**
	 * The function to display Author Bio in a theme.
	 *
	 * @deprecated 13.9 Moved to Classic Theme Helper package.
	 */
	function jetpack_author_bio() {
		_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
		// If the theme doesn't support 'jetpack-content-options', don't continue.
		if ( ! current_theme_supports( 'jetpack-content-options' ) ) {
			return;
		}

		$options            = get_theme_support( 'jetpack-content-options' );
		$author_bio         = ( ! empty( $options[0]['author-bio'] ) ) ? $options[0]['author-bio'] : null;
		$author_bio_default = ( isset( $options[0]['author-bio-default'] ) && false === $options[0]['author-bio-default'] ) ? '' : 1;
		$avatar_default     = ( isset( $options[0]['avatar-default'] ) && false === $options[0]['avatar-default'] ) ? '' : 1;

		// If the theme doesn't support 'jetpack-content-options[ 'author-bio' ]', don't continue.
		if ( true !== $author_bio ) {
			return;
		}

		// If 'jetpack_content_author_bio' is false, don't continue.
		if ( ! get_option( 'jetpack_content_author_bio', $author_bio_default ) ) {
			return;
		}

		// If we aren't on a single post, don't continue.
		if ( ! is_single() ) {
			return;
		}

		// Define class for entry-author.
		if ( ! $avatar_default && ! jetpack_has_gravatar( get_the_author_meta( 'user_email' ) ) ) {
			$class = 'author-avatar-hide';
		} else {
			$class = 'author-avatar-show';
		}
		?>
		<div class="entry-author <?php echo esc_attr( $class ); ?>">
			<?php if ( 'author-avatar-show' === $class ) : ?>
			<div class="author-avatar">
				<?php
				/**
				 * Filter the author bio avatar size.
				 *
				 * @param int $size The avatar height and width size in pixels.
				 *
				 * @module theme-tools
				 *
				 * @since 4.5.0
				 */
				$author_bio_avatar_size = apply_filters( 'jetpack_author_bio_avatar_size', 48 );

				echo get_avatar( get_the_author_meta( 'user_email' ), $author_bio_avatar_size );
				?>
			</div><!-- .author-avatar -->
			<?php endif; ?>

			<div class="author-heading">
				<h2 class="author-title">
					<?php
						/* translators: %s: post author */
						printf( esc_html__( 'Published by %s', 'jetpack' ), '<span class="author-name">' . get_the_author() . '</span>' );
					?>
				</h2>
			</div><!-- .author-heading -->

			<p class="author-bio">
				<?php the_author_meta( 'description' ); ?>
				<a class="author-link" href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>" rel="author">
					<?php
						/* translators: %s: post author */
						printf( esc_html__( 'View all posts by %s', 'jetpack' ), get_the_author() );
					?>
				</a>
			</p><!-- .author-bio -->
		</div><!-- .entry-author -->
		<?php
	}

}

if ( ! function_exists( 'jetpack_has_gravatar' ) ) {

	/**
	 * Checks to see if the specified email address has a Gravatar image.
	 *
	 * @deprecated 13.9 Moved to Classic Theme Helper package.
	 * @param string $email The email of the address of the user to check.
	 * @return bool Whether or not the user has a gravatar
	 */
	function jetpack_has_gravatar( $email ) {
		_deprecated_function( __FUNCTION__, 'jetpack-13.9' );
		$url     = get_avatar_url( $email, array( 'default' => '404' ) );
		$headers = get_headers( $url );

		// If 200 is found, the user has a Gravatar; otherwise, they don't.
		return str_contains( $headers[0], '200' );
	}

}
