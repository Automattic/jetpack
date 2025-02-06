<?php
/**
 * Server-side rendering of the `newspack-blocks/homepage-posts` block.
 *
 * @package WordPress
 */

/**
 * Calculate the maximum width of an image in the Homepage Posts block.
 */
function newspack_blocks_hpb_maximum_image_width() {
	$max_width = 0;

	global $newspack_blocks_hpb_rendering_context;
	if ( isset( $newspack_blocks_hpb_rendering_context['attrs'] ) ) {
		$attributes = $newspack_blocks_hpb_rendering_context['attrs'];
		if ( empty( $attributes ) ) {
			return $max_width;
		}
		if ( isset( $attributes['align'] ) && in_array( $attributes['align'], [ 'full', 'wide' ], true ) ) {
			// For full and wide alignments, the image width is more than 100% of the content width
			// and depends on site width. Can't make assumptions about the site width.
			return $max_width;
		}
		$site_content_width  = 1200;
		$is_image_half_width = in_array( $attributes['mediaPosition'], [ 'left', 'right' ], true );
		if ( 'grid' === $attributes['postLayout'] ) {
			$columns = absint( $attributes['columns'] );
			if ( $is_image_half_width ) {
				// If the media position is on left or right, the image is 50% of the column width.
				$columns = $columns * 2;
			}
			return $site_content_width / $columns;
		} elseif ( 'list' === $attributes['postLayout'] && $is_image_half_width ) {
			return $site_content_width / 2;
		}
	}
	return $max_width;
}

/**
 * Set image `sizes` attribute based on the maximum image width.
 *
 * @param array $sizes Sizes for the sizes attribute.
 */
function newspack_blocks_filter_hpb_sizes( $sizes ) {
	if ( defined( 'NEWSPACK_DISABLE_HPB_IMAGE_OPTIMISATION' ) && NEWSPACK_DISABLE_HPB_IMAGE_OPTIMISATION ) {
		// Allow disabling the image optimisation per-site.
		return $sizes;
	}
	global $newspack_blocks_hpb_current_theme;
	if ( ! $newspack_blocks_hpb_current_theme ) {
		$newspack_blocks_hpb_current_theme = wp_get_theme()->template;
	}
	if ( stripos( $newspack_blocks_hpb_current_theme, 'newspack' ) === false ) {
		// Bail if not using a Newspack theme – assumptions about the site content width can't be made then.
		return $sizes;
	}
	$max_width = newspack_blocks_hpb_maximum_image_width();
	if ( 0 !== $max_width ) {
		// >=782px is the desktop size – set width as computed.
		$sizes = '(min-width: 782px) ' . $max_width . 'px';
		// Between 600-782px is the tablet size – all columns will collapse to two-column layout
		// (assuming 5% padding on each side and between columns).
		$sizes .= ', (min-width: 600px) 42.5vw';
		// <=600px is the mobile size – columns will stack to full width
		// (assumming 5% side padding on each side).
		$sizes .= ', 90vw';
	}
	return $sizes;
}

/**
 * Retrieve Homepage Articles blocks from blocks, recursively.
 *
 * @param array  $blocks The blocks to search.
 * @param string $block_name The block name to search for.
 */
function newspack_blocks_retrieve_homepage_articles_blocks( $blocks, $block_name ) {
	$ha_blocks = [];
	foreach ( $blocks as $block ) {
		if ( $block_name === $block['blockName'] ) {
			$ha_blocks = array_merge( $ha_blocks, [ $block ] );
		}
		if ( is_array( $block['innerBlocks'] ) ) {
			$ha_blocks = array_merge( $ha_blocks, newspack_blocks_retrieve_homepage_articles_blocks( $block['innerBlocks'], $block_name ) );
		}
	}
	return $ha_blocks;
}

/**
 * Collect all attributes' values used in a set of blocks.
 *
 * @param array $blocks The blocks to search.
 */
function newspack_blocks_collect_all_attribute_values( $blocks ) {
	$result = [];

	foreach ( $blocks as $block ) {
		foreach ( $block as $key => $value ) {
			if ( ! isset( $result[ $key ] ) ) {
				$result[ $key ] = [];
			}
			if ( ! in_array( $value, $result[ $key ], true ) ) {
				$result[ $key ][] = $value;
			}
		}
	}

	return $result;
}

/**
 * Output a CSS string based on attributes used in a set of blocks.
 * This is to mitigate CLS. Any CSS that might cause CLS should be output here,
 * inline and before the blocks are printed.
 *
 * @param array $attrs The attributes used in the blocks.
 */
function newspack_blocks_get_homepage_articles_css_string( $attrs ) {
	$entry_title_type_scale = [
		'0.7em',
		'0.9em',
		'1em',
		'1.2em',
		'1.4em',
		'1.7em',
		'2em',
		'2.2em',
		'2.4em',
		'2.6em',
	];

	ob_start();
	?>
		.wp-block-newspack-blocks-homepage-articles article .entry-title {
			font-size: 1.2em;
		}
		.wp-block-newspack-blocks-homepage-articles .entry-meta {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			margin-top: 0.5em;
		}
		.wp-block-newspack-blocks-homepage-articles article .entry-meta {
			font-size: 0.8em;
		}
		.wp-block-newspack-blocks-homepage-articles article .avatar {
			height: 25px;
			width: 25px;
		}
		.wp-block-newspack-blocks-homepage-articles .post-thumbnail{
			margin: 0;
			margin-bottom: 0.25em;
		}
		.wp-block-newspack-blocks-homepage-articles .post-thumbnail img {
			height: auto;
			width: 100%;
		}
		.wp-block-newspack-blocks-homepage-articles .post-thumbnail figcaption {
			margin-bottom: 0.5em;
		}
		.wp-block-newspack-blocks-homepage-articles p {
			margin: 0.5em 0;
		}

		<?php
		if ( isset( $attrs['typeScale'] ) ) {
			foreach ( $attrs['typeScale'] as $scale ) {
				echo esc_html(
					".wpnbha.ts-$scale .entry-title{font-size: {$entry_title_type_scale[$scale - 1]}}"
				);
				if ( in_array( $scale, [ 8, 9, 10 ], true ) ) {
					echo esc_html(
						".wpnbha.ts-$scale .entry-title {line-height: 1.1;}"
					);
				}
				if ( in_array( $scale, [ 7, 8, 9, 10 ], true ) ) {
					echo esc_html(
						".wpnbha.ts-$scale .newspack-post-subtitle {font-size: 1.4em;}"
					);
				}
				if ( in_array( $scale, [ 6 ], true ) ) {
					echo esc_html(
						".wpnbha.ts-$scale article .newspack-post-subtitle {font-size: 1.4em;}"
					);
				}
				if ( in_array( $scale, [ 5 ], true ) ) {
					echo esc_html(
						".wpnbha.ts-$scale article .newspack-post-subtitle {font-size: 1.2em;}"
					);
				}
				if ( in_array( $scale, [ 1, 2, 3 ], true ) ) {
					echo esc_html(
						".wpnbha.ts-$scale article .newspack-post-subtitle, .wpnbha.ts-$scale article .entry-wrapper p, .wpnbha.ts-$scale article .entry-wrapper .more-link, .wpnbha.ts-$scale article .entry-meta {font-size: 0.8em;}"
					);
				}
			}
		}
		if ( isset( $attrs['showSubtitle'] ) && in_array( 1, $attrs['showSubtitle'], false ) ) { // phpcs:ignore WordPress.PHP.StrictInArray.FoundNonStrictFalse
			echo esc_html(
				'.newspack-post-subtitle--in-homepage-block {
					margin-top: 0.3em;
					margin-bottom: 0;
					line-height: 1.4;
					font-style: italic;
				}'
			);
		}
		?>
	<?php
	return ob_get_clean();
}

/**
 * Renders the `newspack-blocks/homepage-posts` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with latest posts added.
 */
function newspack_blocks_render_block_homepage_articles( $attributes ) {
	// Don't output the block inside RSS feeds.
	if ( is_feed() ) {
		return;
	}

	$block_name = apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/homepage-articles' );
	$article_query = new WP_Query( Newspack_Blocks::build_articles_query( $attributes, $block_name ) );
	if ( ! $article_query->have_posts() ) {
		return;
	}

	// Gather all Homepage Articles blocks on the page and output only the needed CSS.
	// This CSS will be printed along with the first found block markup.
	global $newspack_blocks_hpb_all_blocks;
	$inline_style_html = '';
	if ( ! is_array( $newspack_blocks_hpb_all_blocks ) ) {
		$newspack_blocks_hpb_all_blocks = newspack_blocks_retrieve_homepage_articles_blocks(
			parse_blocks( get_the_content() ),
			$block_name
		);
		$all_used_attrs                 = newspack_blocks_collect_all_attribute_values( array_column( $newspack_blocks_hpb_all_blocks, 'attrs' ) );
		$css_string                     = newspack_blocks_get_homepage_articles_css_string( $all_used_attrs );
		ob_start();
		?>
			<style id="newspack-blocks-inline-css" type="text/css"><?php echo esc_html( $css_string ); ?></style>
		<?php
		$inline_style_html = ob_get_clean();
	}

	// This will let the FSE plugin know we need CSS/JS now.
	do_action( 'newspack_blocks_render_homepage_articles' );

	$classes = Newspack_Blocks::block_classes( 'homepage-articles', $attributes, [ 'wpnbha' ] );

	if ( isset( $attributes['postLayout'] ) && 'grid' === $attributes['postLayout'] ) {
		$classes .= ' is-grid';
	}
	if ( isset( $attributes['columns'] ) && 'grid' === $attributes['postLayout'] ) {
		$classes .= ' columns-' . $attributes['columns'] . ' colgap-' . $attributes['colGap'];
	}
	if ( $attributes['showImage'] ) {
		$classes .= ' show-image';
	}
	if ( $attributes['showImage'] && isset( $attributes['mediaPosition'] ) ) {
		$classes .= ' image-align' . $attributes['mediaPosition'];
	}
	if ( isset( $attributes['typeScale'] ) ) {
		$classes .= ' ts-' . $attributes['typeScale'];
	}
	if ( $attributes['showImage'] && isset( $attributes['imageScale'] ) ) {
		$classes .= ' is-' . $attributes['imageScale'];
	}
	if ( $attributes['showImage'] ) {
		$classes .= ' is-' . $attributes['imageShape'];
	}
	if ( $attributes['showImage'] && $attributes['mobileStack'] ) {
		$classes .= ' mobile-stack';
	}
	if ( $attributes['showCaption'] ) {
		$classes .= ' show-caption';
	}
	if ( $attributes['showCredit'] ) {
		$classes .= ' show-credit';
	}
	if ( $attributes['showCategory'] ) {
		$classes .= ' show-category';
	}
	if ( isset( $attributes['className'] ) ) {
		$classes .= ' ' . $attributes['className'];
	}
	if ( $attributes['textAlign'] ) {
		$classes .= ' has-text-align-' . $attributes['textAlign'];
	}

	if ( '' !== $attributes['textColor'] || '' !== $attributes['customTextColor'] ) {
		$classes .= ' has-text-color';
	}
	if ( '' !== $attributes['textColor'] ) {
		$classes .= ' has-' . $attributes['textColor'] . '-color';
	}

	$styles = '';

	if ( '' !== $attributes['customTextColor'] ) {
		$styles = 'color: ' . $attributes['customTextColor'] . ';';
	}

	// Handle custom taxonomies.
	if ( isset( $attributes['customTaxonomies'] ) ) {
		$custom_taxes = $attributes['customTaxonomies'];
		unset( $attributes['customTaxonomies'] );
		if ( is_array( $custom_taxes ) && ! empty( $custom_taxes ) ) {
			foreach ( $custom_taxes as $tax ) {
				if ( ! empty( $tax['slug'] ) && ! empty( $tax['terms'] ) ) {
					$attributes[ $tax['slug'] ] = $tax['terms'];
				}
			}
		}
	}

	$articles_rest_url = add_query_arg(
		array_merge(
			map_deep(
				$attributes,
				function( $attribute ) {
					return false === $attribute ? '0' : rawurlencode( $attribute );
				}
			),
			[
				'page' => 2,
			]
		),
		rest_url( '/newspack-blocks/v1/articles' )
	);

	$page = $article_query->paged ?? 1;

	$has_more_pages = ( ++$page ) <= $article_query->max_num_pages;

	/**
	 * Hide the "More" button on private sites.
	 *
	 * Client-side fetching from a private WP.com blog requires authentication,
	 * which is not provided in the current implementation.
	 * See https://github.com/Automattic/newspack-blocks/issues/306.
	 */
	$is_blog_private = (int) get_option( 'blog_public' ) === -1;

	$has_more_button = ! $is_blog_private && $has_more_pages && (bool) $attributes['moreButton'];

	if ( $has_more_button ) {
		$classes .= ' has-more-button';
	}

	ob_start();

	?>
	<div
		class="<?php echo esc_attr( $classes ); ?>"
		style="<?php echo esc_attr( $styles ); ?>"
		>
		<?php echo $inline_style_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
		<div data-posts data-current-post-id="<?php the_ID(); ?>">
			<?php if ( '' !== $attributes['sectionHeader'] ) : ?>
				<h2 class="article-section-title">
					<span><?php echo wp_kses_post( $attributes['sectionHeader'] ); ?></span>
				</h2>
			<?php endif; ?>
			<?php
			echo Newspack_Blocks::template_inc( // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				__DIR__ . '/templates/articles-list.php',
				[
					'articles_rest_url' => $articles_rest_url, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					'article_query'     => $article_query, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					'attributes'        => $attributes, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				]
			);
			?>
		</div>
		<?php

		if ( $has_more_button ) :
			$load_more = '';
			if ( (bool) $attributes['infiniteScroll'] ) {
				$load_more = 'data-infinite-scroll="true"';
			}
			?>
			<button type="button" class="wp-block-button__link" <?php echo esc_attr( $load_more ); ?> data-next="<?php echo esc_url( $articles_rest_url ); ?>">
				<span class="label">
					<?php
					if ( ! empty( $attributes['moreButtonText'] ) ) {
						echo esc_html( $attributes['moreButtonText'] );
					} else {
						esc_html_e( 'Load more posts', 'jetpack-mu-wpcom' );
					}
					?>
				</span>
				<span class="loading"></span>
			</button>
			<p class="error">
				<?php esc_html_e( 'Something went wrong. Please refresh the page and/or try again.', 'jetpack-mu-wpcom' ); ?>
			</p>

		<?php endif; ?>

	</div>
	<?php

	$content = ob_get_clean();
	Newspack_Blocks::enqueue_view_assets( 'homepage-articles' );

	return $content;
}

/**
 * Registers the `newspack-blocks/homepage-articles` block on server.
 */
function newspack_blocks_register_homepage_articles() {
	$block = json_decode(
		file_get_contents( __DIR__ . '/block.json' ), // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		true
	);
	register_block_type(
		apply_filters( 'newspack_blocks_block_name', 'newspack-blocks/' . $block['name'] ),
		apply_filters(
			'newspack_blocks_block_args',
			array(
				'attributes'      => $block['attributes'],
				'render_callback' => 'newspack_blocks_render_block_homepage_articles',
				'supports'        => [],
			),
			$block['name']
		)
	);
}
add_action( 'init', 'newspack_blocks_register_homepage_articles' );


/**
 * Renders author avatar markup.
 *
 * @param array $author_info Author info array.
 *
 * @return string Returns formatted Avatar markup
 */
function newspack_blocks_format_avatars( $author_info ) {
	$elements = array_map(
		function ( $author ) {
			return sprintf(
				'<a href="%s">%s</a>',
				esc_url( $author->url ),
				wp_kses(
					$author->avatar,
					Newspack_Blocks::get_sanitized_image_attributes()
				)
			);
		},
		$author_info
	);

	return implode( '', $elements );
}

/**
 * Renders byline markup.
 *
 * @param array $author_info Author info array.
 *
 * @return string Returns byline markup.
 */
function newspack_blocks_format_byline( $author_info ) {
	$index    = -1;
	$elements = array_merge(
		[
			'<span class="author-prefix">' . esc_html_x( 'by', 'post author', 'jetpack-mu-wpcom' ) . '</span> ',
		],
		array_reduce(
			$author_info,
			function ( $accumulator, $author ) use ( $author_info, &$index ) {
				$index++;
				$penultimate = count( $author_info ) - 2;
				return array_merge(
					$accumulator,
					[
						sprintf(
							/* translators: 1: author link. 2: author name. 3. variable seperator (comma, 'and', or empty) */
							'<span class="author vcard"><a class="url fn n" href="%1$s">%2$s</a></span>',
							esc_url( $author->url ),
							esc_html( $author->display_name )
						),
						( $index < $penultimate ) ? ', ' : '',
						( count( $author_info ) > 1 && $penultimate === $index ) ? esc_html_x( ' and ', 'post author', 'jetpack-mu-wpcom' ) : '',
					]
				);
			},
			[]
		)
	);

	return implode( '', $elements );
}

/**
 * Renders category markup plus filter.
 *
 * @param string $post_id Post ID.
 */
function newspack_blocks_format_categories( $post_id ) {
	$category = false;
	// Use Yoast primary category if set.
	if ( class_exists( 'WPSEO_Primary_Term' ) ) {
		$primary_term = new WPSEO_Primary_Term( 'category', $post_id );
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

	if ( ! is_a( $category, 'WP_Term' ) ) {
		return '';
	}

	$category_link      = get_category_link( $category->term_id );
	$category_formatted = esc_html( $category->name );

	if ( ! empty( $category_link ) ) {
		$category_formatted = '<a href="' . esc_url( $category_link ) . '">' . $category_formatted . '</a>';
	}

	return apply_filters( 'newspack_blocks_categories', $category_formatted );
}
