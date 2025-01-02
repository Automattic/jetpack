<?php
/**
 * Article template.
 *
 * @global array $attributes Block attributes.
 * @package WordPress
 */

call_user_func(
	function( $data ) {
		$attributes = apply_filters( 'newspack_blocks_homepage_posts_block_attributes', $data['attributes'] );
		$authors    = Newspack_Blocks::prepare_authors();
		$classes    = array();
		$styles     = '';
		$post_id    = get_the_ID();

		// Get sponsors for this post.
		$sponsors = Newspack_Blocks::get_all_sponsors( $post_id );

		// Add classes based on the post's assigned categories and tags.
		$classes[] = Newspack_Blocks::get_term_classes( $post_id );

		// Add class if post has a featured image.
		if ( has_post_thumbnail() ) {
			$classes[] = 'post-has-image';
		}

		// If the post is a sponsor or supporter, it won't have a working permalink, but it might have an external URL.
		$post_link = Newspack_Blocks::get_post_link( $post_id );

		if ( 'behind' === $attributes['mediaPosition'] && $attributes['showImage'] && has_post_thumbnail() ) {
			$styles = 'min-height: ' . absint( $attributes['minHeight'] ) . 'vh; padding-top: ' . ( absint( $attributes['minHeight'] ) / 5 ) . 'vh;';
		}
		$image_size = 'newspack-article-block-uncropped';
		if ( has_post_thumbnail() && 'uncropped' !== $attributes['imageShape'] ) {
			$image_size = Newspack_Blocks::image_size_for_orientation( $attributes['imageShape'] );
		}
		$thumbnail_args = array(
			'data-hero-candidate' => true,
			'alt'                 => trim( wp_strip_all_tags( get_the_title( $post_id ) ) ),
		);

		// This global will be used by the newspack_blocks_filter_hpb_srcset filter.
		global $newspack_blocks_hpb_rendering_context;
		$newspack_blocks_hpb_rendering_context = [ 'attrs' => $attributes ];

		// Disable lazy loading by using an arbitraty `loading` attribute other than `lazy`.
		// Empty string or `false` would still result in `lazy`.
		if ( $attributes['disableImageLazyLoad'] ) {
			$thumbnail_args['loading'] = 'none';
		}
		if ( $attributes['fetchPriority'] && in_array( $attributes['fetchPriority'], [ 'high', 'low', 'auto' ], true ) ) {
			$thumbnail_args['fetchpriority'] = $attributes['fetchPriority'];
		}

		// Support Newspack Listings hide author/publish date options.
		$hide_author       = apply_filters( 'newspack_listings_hide_author', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$hide_publish_date = apply_filters( 'newspack_listings_hide_publish_date', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$show_author       = $attributes['showAuthor'] && ! $hide_author;
		$show_date         = $attributes['showDate'] && ! $hide_publish_date;
		?>

	<article data-post-id="<?php the_id(); ?>"
		class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"
		<?php if ( $styles ) : ?>
		style="<?php echo esc_attr( $styles ); ?>"
		<?php endif; ?>
		>
		<?php echo Newspack_Blocks::get_post_status_label(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<?php if ( has_post_thumbnail() && $attributes['showImage'] && $attributes['imageShape'] ) : ?>
			<figure class="post-thumbnail">
				<?php if ( $post_link ) : ?>
				<a href="<?php echo esc_url( $post_link ); ?>" rel="bookmark" tabindex="-1" aria-hidden="true">
				<?php endif; ?>
				<?php add_filter( 'wp_calculate_image_sizes', 'newspack_blocks_filter_hpb_sizes' ); ?>
				<?php the_post_thumbnail( $image_size, $thumbnail_args ); ?>
				<?php remove_filter( 'wp_calculate_image_sizes', 'newspack_blocks_filter_hpb_sizes' ); ?>
				<?php if ( $post_link ) : ?>
				</a>
				<?php endif; ?>

				<?php if ( $attributes['showCaption'] || $attributes['showCredit'] ) : ?>
					<?php echo wp_kses_post( Newspack_Blocks::get_image_caption( get_post_thumbnail_id(), $attributes['showCaption'], $attributes['showCredit'] ) ); ?>
				<?php endif; ?>
			</figure><!-- .featured-image -->
		<?php endif; ?>

		<div class="entry-wrapper">
			<?php if ( ! empty( $sponsors ) || ( $attributes['showCategory'] ) ) : ?>

				<div class="cat-links <?php if ( ! empty( $sponsors ) ) : ?>sponsor-label<?php endif; // phpcs:ignore Squiz.ControlStructures.ControlSignature.NewlineAfterOpenBrace ?>">
					<?php if ( ! empty( $sponsors ) ) : ?>
						<span class="flag">
							<?php echo esc_html( Newspack_Blocks::get_sponsor_label( $sponsors ) ); ?>
						</span>
						<?php
					endif;

					if ( $attributes['showCategory'] && ( empty( $sponsors ) || Newspack_Blocks::newspack_display_sponsors_and_categories( $sponsors ) ) ) :
						echo wp_kses_post( newspack_blocks_format_categories( $post_id ) );
					endif;
					?>
				</div>
				<?php
			endif;

			if ( '' === $attributes['sectionHeader'] ) {
				// Don't link the title if the post lacks a valid URL.
				if ( ! $post_link ) {
					the_title( '<h2 class="entry-title">', '</h2>' );
				} else {
					the_title( '<h2 class="entry-title"><a href="' . esc_url( $post_link ) . '" rel="bookmark">', '</a></h2>' );
				}
			} elseif ( ! $post_link ) {
				// Don't link the title if the post lacks a valid URL.
				the_title( '<h3 class="entry-title">', '</h3>' );
			} else {
				the_title( '<h3 class="entry-title"><a href="' . esc_url( $post_link ) . '" rel="bookmark">', '</a></h3>' );
			}
			?>
			<?php
			if ( $attributes['showSubtitle'] ) :
				$subtitle = get_post_meta( $post_id, 'newspack_post_subtitle', true );

				?>
				<div class="newspack-post-subtitle newspack-post-subtitle--in-homepage-block">
					<?php
					$allowed_tags = array(
						'b'      => true,
						'strong' => true,
						'i'      => true,
						'em'     => true,
						'mark'   => true,
						'u'      => true,
						'small'  => true,
						'sub'    => true,
						'sup'    => true,
						'a'      => array(
							'href'   => true,
							'target' => true,
							'rel'    => true,
						),
					);

					echo wptexturize( wp_kses( $subtitle, $allowed_tags ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
				</div>
			<?php endif; ?>
			<?php
			if ( $attributes['showExcerpt'] && ! $attributes['showFullContent'] ) :
				the_excerpt();
			endif;
			if ( $attributes['showFullContent'] && ! $attributes['showExcerpt'] ) :
				the_content();
			endif;
			if ( $post_link && ( $attributes['showReadMore'] ) ) :
				?>
				<a class="more-link" href="<?php echo esc_url( $post_link ); ?>" rel="bookmark">
					<?php echo esc_html( $attributes['readMoreLabel'] ); ?>
				</a>
				<?php
			endif;
			if ( $show_author || $show_date || ! empty( $sponsors ) ) :
				?>
				<div class="entry-meta">
					<?php
					if ( ! empty( $sponsors ) ) :
						$sponsor_classes = [ 'entry-sponsors' ];
						if ( Newspack_Blocks::newspack_display_sponsors_and_authors( $sponsors ) ) {
							$sponsor_classes[] = 'plus-author';
						}
						?>
						<span class="<?php echo esc_attr( implode( ' ', $sponsor_classes ) ); ?>">
								<?php
								$logos = Newspack_Blocks::get_sponsor_logos( $sponsors );
								if ( ! empty( $logos ) ) :
									?>
								<span class="sponsor-logos">
									<?php
									foreach ( $logos as $logo ) {
										if ( '' !== $logo['url'] ) {
											echo '<a href="' . esc_url( $logo['url'] ) . '" target="_blank">';
										}
										echo '<img src="' . esc_url( $logo['src'] ) . '" alt="' . esc_attr( $logo['alt'] ) . '" width="' . esc_attr( $logo['width'] ) . '" height="' . esc_attr( $logo['height'] ) . '">';
										if ( '' !== $logo['url'] ) {
											echo '</a>';
										}
									}
									?>
								</span>
							<?php endif; ?>
							<span class="byline sponsor-byline">
								<?php
								$bylines = Newspack_Blocks::get_sponsor_byline( $sponsors );
								echo esc_html( $bylines[0]['byline'] ) . ' ';
								foreach ( $bylines as $byline ) {
									echo '<span class="author">';
									if ( '' !== $byline['url'] ) {
										echo '<a target="_blank" href="' . esc_url( $byline['url'] ) . '">';
									}
									echo esc_html( $byline['name'] );
									if ( '' !== $byline['url'] ) {
										echo '</a>';
									}
									echo '</span>' . esc_html( $byline['sep'] );
								}
								?>
							</span><!-- /.sponsor-byline -->
						</span><!-- .entry-sponsors -->
						<?php
					endif;

					if ( $show_author && ( empty( $sponsors ) || Newspack_Blocks::newspack_display_sponsors_and_authors( $sponsors ) ) ) :
						if ( $attributes['showAvatar'] ) :
							echo wp_kses(
								newspack_blocks_format_avatars( $authors ),
								Newspack_Blocks::get_sanitized_image_attributes()
							);
						endif;
						?>
						<span class="byline">
							<?php echo wp_kses_post( newspack_blocks_format_byline( $authors ) ); ?>
						</span><!-- .author-name -->
						<?php
					endif;
					if ( $show_date ) :
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
							esc_attr( Newspack_Blocks::get_displayed_post_date() ),
							esc_html( Newspack_Blocks::get_formatted_displayed_post_date() ),
							esc_attr( get_the_modified_date( DATE_W3C ) ),
							esc_html( get_the_modified_date() )
						);
					endif;
					echo Newspack_Blocks::get_article_meta_footer();  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					?>
				</div><!-- .entry-meta -->
			<?php endif; ?>
		</div><!-- .entry-wrapper -->
	</article>

		<?php
	},
	$data // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
);
