<?php
/**
 * Article template.
 *
 * @global array $attributes Block attributes.
 * @package WordPress
 */

call_user_func(
	function ( $data ) {
		$attributes = $data['attributes'];
		$authors    = Newspack_Blocks::prepare_authors();
		$classes    = array();
		$styles     = '';

		// Add classes based on the post's assigned categories and tags.
		$classes[] = Newspack_Blocks::get_term_classes( get_the_ID() );

		// Add class if post has a featured image.
		if ( has_post_thumbnail() ) {
			$classes[] = 'post-has-image';
		}

		if ( 'behind' === $attributes['mediaPosition'] && $attributes['showImage'] && has_post_thumbnail() ) {
			$styles = 'min-height: ' . $attributes['minHeight'] . 'vh; padding-top: ' . ( $attributes['minHeight'] / 5 ) . 'vh;';
		}
		$image_size = 'newspack-article-block-uncropped';
		if ( has_post_thumbnail() && 'uncropped' !== $attributes['imageShape'] ) {
			$image_size = Newspack_Blocks::image_size_for_orientation( $attributes['imageShape'] );
		}
		$thumbnail_args = '';
		// If the image position is behind, pass the object-fit setting to maintain styles with AMP.
		if ( 'behind' === $attributes['mediaPosition'] ) {
			$thumbnail_args = array( 'object-fit' => 'cover' );
		}
		$category = false;
		// Use Yoast primary category if set.
		if ( class_exists( 'WPSEO_Primary_Term' ) ) {
			$primary_term = new WPSEO_Primary_Term( 'category', get_the_ID() );
			$category_id  = $primary_term->get_primary_term();
			if ( $category_id ) {
				$category = get_term( $category_id );
			}
		}
		if ( ! $category ) {
			$categories_list = get_the_category();
			if ( ! empty( $categories_list ) ) {
				$category = $categories_list[0];
			}
		}
		?>

	<article data-post-id="<?php the_id(); ?>"
		class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"
		<?php if ( $styles ) : ?>
		style="<?php echo esc_attr( $styles ); ?>"
		<?php endif; ?>
		>
		<?php if ( has_post_thumbnail() && $attributes['showImage'] && $attributes['imageShape'] ) : ?>
			<figure class="post-thumbnail">
				<a href="<?php the_permalink(); ?>" rel="bookmark">
					<?php the_post_thumbnail( $image_size, $thumbnail_args ); ?>
				</a>

				<?php if ( $attributes['showCaption'] && '' !== get_the_post_thumbnail_caption() ) : ?>
					<figcaption><?php the_post_thumbnail_caption(); ?></figcaption>
				<?php endif; ?>
			</figure><!-- .featured-image -->
		<?php endif; ?>

		<div class="entry-wrapper">
			<?php if ( Newspack_Blocks::get_all_sponsors( get_the_id() ) ) : ?>
				<span class="cat-links sponsor-label">
					<span class="flag">
						<?php echo esc_html( Newspack_Blocks::get_sponsor_label( get_the_id() ) ); ?>
					</span>
				</span>
			<?php elseif ( $attributes['showCategory'] && $category ) : ?>
				<div class="cat-links">
					<a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>">
						<?php echo esc_html( $category->name ); ?>
					</a>
				</div>
				<?php
			endif;

			if ( '' === $attributes['sectionHeader'] ) :
				// Don't link the title if using the post format aside.
				if ( has_post_format( 'aside' ) ) :
					the_title( '<h2 class="entry-title">', '</h2>' );
				else :
					the_title( '<h2 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h2>' );
				endif;
			else :
				// Don't link the title if using the post format aside.
				if ( has_post_format( 'aside' ) ) :
					the_title( '<h3 class="entry-title">', '</h3>' );
				else :
					the_title( '<h3 class="entry-title"><a href="' . esc_url( get_permalink() ) . '" rel="bookmark">', '</a></h3>' );
				endif;
			endif;
			?>
			<?php
			if ( $attributes['showSubtitle'] ) :
				?>
				<div class="newspack-post-subtitle newspack-post-subtitle--in-homepage-block">
					<?php echo esc_html( get_post_meta( get_the_ID(), 'newspack_post_subtitle', true ) ); ?>
				</div>
			<?php endif; ?>
			<?php
			if ( $attributes['showExcerpt'] ) :
				if ( has_post_format( 'aside' ) ) :
					the_content();
				else :
					the_excerpt();
				endif;
			endif;
			if ( $attributes['showAuthor'] || $attributes['showDate'] || Newspack_Blocks::get_all_sponsors( get_the_id() ) ) :
				?>
				<div class="entry-meta">
					<?php if ( Newspack_Blocks::get_all_sponsors( get_the_id() ) ) : ?>
						<?php
						$logos = Newspack_Blocks::get_sponsor_logos( get_the_id() );
						if ( ! empty( $logos ) ) :
							?>
						<span class="sponsor-logos">
							<?php
							foreach ( $logos as $logo ) {
								if ( '' !== $logo['url'] ) {
									echo '<a href="' . esc_url( $logo['url'] ) . '" target="_blank">';
								}
								echo '<img src="' . esc_url( $logo['src'] ) . '" width="' . esc_attr( $logo['width'] ) . '" height="' . esc_attr( $logo['height'] ) . '">';
								if ( '' !== $logo['url'] ) {
									echo '</a>';
								}
							}
							?>
						</span>
					<?php endif; ?>
					<span class="byline sponsor-byline">
						<?php
						$bylines = Newspack_Blocks::get_sponsor_byline( get_the_id() );
						echo esc_html( $bylines[0]['byline'] ) . ' ';
						foreach ( $bylines as $byline ) {
							echo '<span class="author">';
							if ( '' !== $byline['url'] ) {
								echo '<a target="_blank" href="' . esc_url( $byline['url'] ) . '">';
							}
							echo esc_html( $byline['name'] );
							if ( '' !== $byline['url'] ) {
								'</a>';
							}
							echo '</span>' . esc_html( $byline['sep'] );
						}
						?>
					</span>
						<?php
					else :
						if ( $attributes['showAuthor'] ) :
							if ( $attributes['showAvatar'] ) :
								echo wp_kses(
									Automattic\Jetpack\Extensions\HomepageArticles\newspack_blocks_format_avatars( $authors ),
									array(
										'img'      => array(
											'class'  => true,
											'src'    => true,
											'alt'    => true,
											'width'  => true,
											'height' => true,
											'data-*' => true,
											'srcset' => true,
										),
										'noscript' => array(),
										'a'        => array(
											'href' => true,
										),
									)
								);
							endif;
							?>
							<span class="byline">
								<?php echo wp_kses_post( Automattic\Jetpack\Extensions\HomepageArticles\newspack_blocks_format_byline( $authors ) ); ?>
							</span><!-- .author-name -->
							<?php
						endif;
					endif;
					if ( $attributes['showDate'] ) :
						$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
						if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) :
							$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time><time class="updated" datetime="%3$s">%4$s</time>';
						endif;
						printf(
							wp_kses(
								$time_string,
								array(
									'time' => array(
										'class'    => true,
										'datetime' => true,
									),
								)
							),
							esc_attr( get_the_date( DATE_W3C ) ),
							esc_html( get_the_date() ),
							esc_attr( get_the_modified_date( DATE_W3C ) ),
							esc_html( get_the_modified_date() )
						);
					endif;
					?>
				</div><!-- .entry-meta -->
			<?php endif; ?>
		</div><!-- .entry-wrapper -->
	</article>

		<?php
	},
	$data // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
);
