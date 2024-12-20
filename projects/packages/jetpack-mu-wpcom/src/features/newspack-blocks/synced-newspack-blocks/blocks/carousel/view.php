<?php
/**
 * Server-side rendering of the `newspack-blocks/carousel` block.
 *
 * @package WordPress
 */

/**
 * Renders the `newspack-blocks/carousel` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest posts added.
 */
function newspack_blocks_render_block_carousel( $attributes ) {
	static $newspack_blocks_carousel_id = 0;
	global $newspack_blocks_post_id;

	// This will let the FSE plugin know we need CSS/JS now.
	do_action( 'newspack_blocks_render_post_carousel' );

	$newspack_blocks_carousel_id++;
	$autoplay = isset( $attributes['autoplay'] ) ? $attributes['autoplay'] : false;
	$delay    = isset( $attributes['delay'] ) ? absint( $attributes['delay'] ) : 3;
	$authors  = isset( $attributes['authors'] ) ? $attributes['authors'] : array();

	$other = array();
	if ( $autoplay ) {
		$other[] = 'wp-block-newspack-blocks-carousel__autoplay-playing';
	}
	$other[] = 'slides-per-view-' . $attributes['slidesPerView'];
	$other[] = 'wpnbpc';
	$classes = Newspack_Blocks::block_classes( 'carousel', $attributes, $other );

	$article_query = new WP_Query( Newspack_Blocks::build_articles_query( $attributes, apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/carousel' ) ) );
	if ( false === $article_query->have_posts() ) {
		return;
	}

	$counter = 0;

	ob_start();
	if ( $article_query->have_posts() ) :
		while ( $article_query->have_posts() ) :
			$article_query->the_post();
			$post_id                             = get_the_ID();
			$authors                             = Newspack_Blocks::prepare_authors();
			$newspack_blocks_post_id[ $post_id ] = true;

			$article_classes = [
				'post-has-image',
				'swiper-slide',
			];

			// Add classes based on the post's assigned categories and tags.
			$article_classes[] = Newspack_Blocks::get_term_classes( $post_id );

			// Get sponsors for this post.
			$sponsors = Newspack_Blocks::get_all_sponsors( $post_id );

			$counter++;
			$has_featured_image = has_post_thumbnail();
			$post_type          = get_post_type();
			$post_link          = Newspack_Blocks::get_post_link( $post_id );

			// Support Newspack Listings hide author/publish date options.
			$hide_author       = apply_filters( 'newspack_listings_hide_author', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			$hide_publish_date = apply_filters( 'newspack_listings_hide_publish_date', false ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			$show_author       = $attributes['showAuthor'] && ! $hide_author;
			$show_date         = $attributes['showDate'] && ! $hide_publish_date;
			$show_caption      = $attributes['showCaption'];
			$show_credit       = $attributes['showCredit'];

			// Validate the value of the "image fit" attribute.
			$image_fits = [ 'cover', 'contain' ];
			$image_fit  = in_array( $attributes['imageFit'], $image_fits, true ) ? $attributes['imageFit'] : $image_fits[0];
			?>

			<article data-post-id="<?php echo esc_attr( $post_id ); ?>" class="<?php echo esc_attr( implode( ' ', $article_classes ) . ' ' . $post_type ); ?>">
				<?php echo Newspack_Blocks::get_post_status_label(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<figure class="post-thumbnail">
					<?php if ( $post_link ) : ?>
					<a href="<?php echo esc_url( $post_link ); ?>" rel="bookmark" tabindex="-1" aria-hidden="true">
					<?php endif; ?>
						<?php if ( $has_featured_image ) : ?>
							<?php
								the_post_thumbnail(
									'large',
									array(
										'object-fit' => $image_fit,
										'layout'     => 'fill',
										'class'      => 'contain' === $image_fit ? 'image-fit-contain' : 'image-fit-cover',
										'alt'        => trim( wp_strip_all_tags( get_the_title( $post_id ) ) ),
									)
								);
							?>
						<?php else : ?>
							<div class="wp-block-newspack-blocks-carousel__placeholder"></div>
						<?php endif; ?>
					<?php if ( $post_link ) : ?>
					</a>
					<?php endif; ?>
				</figure>

				<?php if ( ! empty( $sponsors ) || $attributes['showCategory'] || $attributes['showTitle'] || $show_author || $show_date || $show_caption || $show_credit ) : ?>
					<div class="entry-wrapper">
						<?php if ( ! empty( $sponsors ) || $attributes['showCategory'] ) : ?>
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

						if ( $attributes['showTitle'] ) {
							the_title( '<h3 class="entry-title"><a href="' . esc_url( $post_link ) . '" rel="bookmark">', '</a></h3>' );
						}
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
									</span>
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
								printf(
									'<time class="entry-date published" datetime="%1$s">%2$s</time>',
									esc_attr( get_the_date( DATE_W3C ) ),
									esc_html( get_the_date() )
								);
							endif;
							if ( $show_caption || $show_credit ) :
								$full_caption = Newspack_Blocks::get_image_caption( get_post_thumbnail_id(), $show_caption, $show_credit );
								if ( $full_caption ) :
									?>
									<div class="entry-caption">
										<?php echo wp_kses_post( $full_caption ); ?>
									<?php
								endif;
							endif;
							?>
						</div><!-- .entry-meta -->
					</div><!-- .entry-wrapper -->
				<?php endif; ?>
			</article>
			<?php
		endwhile;
		endif;
		wp_reset_postdata();
	$slides  = ob_get_clean();
	$buttons = array();
	for ( $x = 0; $x < $counter; $x++ ) {
		$aria_label = sprintf(
			/* translators: %d: Slide number. */
			__( 'Go to slide %d', 'jetpack-mu-wpcom' ),
			absint( $x + 1 )
		);
		$buttons[] = sprintf(
			'<button option="%d" class="swiper-pagination-bullet" aria-label="%s" %s></button>',
			absint( $x ),
			esc_attr( $aria_label ),
			0 === $x ? 'selected' : ''
		);
	}

	$slides_per_view = absint( $attributes['slidesPerView'] ?? 1 );
	$aspect_ratio    = floatval( $attributes['aspectRatio'] ?? 0.75 );

	$selector    = sprintf(
		'<div class="swiper-pagination-bullets" %1$s>%2$s</div>',
		$attributes['hideControls'] ? 'aria-hidden="true"' : '',
		implode( '', $buttons )
	);
	$navigation  = 1 === $counter ? '' : sprintf(
		'<button class="swiper-button swiper-button-prev" aria-label="%1$s" %3$s></button><button class="swiper-button swiper-button-next" aria-label="%2$s" %3$s></button>',
		esc_attr__( 'Previous Slide', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Next Slide', 'jetpack-mu-wpcom' ),
		$attributes['hideControls'] ? 'aria-hidden="true"' : ''
	);
	$carousel    = sprintf(
		'<div class="swiper"><div class="swiper-wrapper">%s</div>%s</div>',
		$slides,
		$navigation
	);
	$autoplay_ui = $autoplay ? newspack_blocks_carousel_block_autoplay_ui( $newspack_blocks_carousel_id ) : '';

	$data_attributes = [
		'data-current-post-id=' . $post_id,
		'data-slides-per-view=' . esc_attr( $slides_per_view ),
		'data-slide-count=' . $counter,
		'data-aspect-ratio=' . esc_attr( $aspect_ratio ),
	];

	if ( $autoplay ) {
		$data_attributes[] = 'data-autoplay=1';
		$data_attributes[] = sprintf( 'data-autoplay_delay=%s', esc_attr( $delay ) );
	}
	Newspack_Blocks::enqueue_view_assets( 'carousel' );
	if ( 1 === $counter ) {
		$selector = '';
	}
	return sprintf(
		'<div class="%1$s" id="wp-block-newspack-carousel__%2$d" %3$s>%4$s%5$s%6$s</div>',
		esc_attr( $classes ),
		absint( $newspack_blocks_carousel_id ),
		esc_attr( implode( ' ', $data_attributes ) ),
		$autoplay_ui,
		$carousel,
		$selector
	);
}

/**
 * Generate autoplay play/pause UI.
 *
 * @return string Autoplay UI markup.
 */
function newspack_blocks_carousel_block_autoplay_ui() {
	return sprintf(
		'<button aria-label="%s" class="swiper-button swiper-button-pause"></button><button aria-label="%s" class="swiper-button swiper-button-play"></button>',
		esc_attr__( 'Pause Slideshow', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Play Slideshow', 'jetpack-mu-wpcom' )
	);
}

/**
 * Registers the `newspack-blocks/carousel` block on server.
 */
function newspack_blocks_register_carousel() {
	register_block_type(
		apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/carousel' ),
		apply_filters(
			'newspack_blocks_block_args',
			array(
				'attributes'      => array(
					'className'        => array(
						'type' => 'string',
					),
					'postsToShow'      => array(
						'type'    => 'integer',
						'default' => 3,
					),
					'authors'          => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'integer',
						),
					),
					'categories'       => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'integer',
						),
					),
					'tags'             => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type' => 'integer',
						),
					),
					'customTaxonomies' => array(
						'type'    => 'array',
						'default' => array(),
						'items'   => array(
							'type'       => 'object',
							'properties' => array(
								'slug'  => array(
									'type' => 'string',
								),
								'terms' => array(
									'type'  => 'array',
									'items' => array(
										'type' => 'integer',
									),
								),
							),
						),
					),
					'autoplay'         => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'delay'            => array(
						'type'    => 'integer',
						'default' => 5,
					),
					'showAuthor'       => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showAvatar'       => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showCaption'      => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'showCredit'       => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'showCategory'     => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'showDate'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'imageFit'         => array(
						'type'    => 'string',
						'default' => 'cover',
					),
					'showTitle'        => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'slidesPerView'    => array(
						'type'    => 'number',
						'default' => 1,
					),
					'hideControls'     => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'aspectRatio'      => array(
						'type'    => 'number',
						'default' => 0.75,
					),
				),
				'render_callback' => 'newspack_blocks_render_block_carousel',
				'supports'        => [],
			),
			'carousel'
		)
	);
}
add_action( 'init', 'newspack_blocks_register_carousel' );
