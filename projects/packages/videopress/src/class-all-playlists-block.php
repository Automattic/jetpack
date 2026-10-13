<?php
/**
 * The All Playlists block: every Video Playlist on the site, as a gallery or a list.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Post;

/**
 * Registers and renders the `videopress/all-playlists` block from the playlist
 * index: a paginated gallery or list of playlist cards, each linking to the
 * post its playlist lives in.
 */
class All_Playlists_Block {

	/**
	 * Block name.
	 *
	 * @var string
	 */
	const BLOCK_NAME = 'videopress/all-playlists';

	/**
	 * Supported layouts, the first being the default.
	 *
	 * @var string[]
	 */
	const LAYOUTS = array( 'gallery', 'list' );

	/**
	 * Supported orders, the first being the default.
	 *
	 * @var string[]
	 */
	const ORDERS = array( 'newest', 'oldest', 'title' );

	/**
	 * Supported pagination styles, the first being the default.
	 *
	 * @var string[]
	 */
	const PAGINATIONS = array( 'numbered', 'load-more' );

	/**
	 * Bounds of the layout settings; the editor controls use the same range.
	 */
	const MIN_COLUMNS      = 1;
	const MAX_COLUMNS      = 6;
	const DEFAULT_COLUMNS  = 3;
	const MIN_PER_PAGE     = 1;
	const MAX_PER_PAGE     = 48;
	const DEFAULT_PER_PAGE = 6;

	/**
	 * Query argument carrying the current page of a numbered pagination.
	 *
	 * @var string
	 */
	const PAGE_QUERY_ARG = 'playlists-page';

	/**
	 * Register the block.
	 *
	 * It lists Video Playlist blocks, so it is only registered where that block is.
	 *
	 * @param string|null $metadata_file Path to the block.json metadata file. Defaults to the
	 *                                   package build output; tests can point it at a fixture.
	 *
	 * @return void
	 */
	public static function register( $metadata_file = null ) {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Index::BLOCK_NAME ) ) {
			return;
		}

		if ( null === $metadata_file ) {
			$metadata_file = __DIR__ . '/../build/block-editor/blocks/all-playlists/block.json';
		}

		if ( ! file_exists( $metadata_file ) ) {
			return;
		}

		$metadata = json_decode(
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			file_get_contents( $metadata_file )
		);

		if ( empty( $metadata->name )
			|| \WP_Block_Type_Registry::get_instance()->is_registered( $metadata->name )
		) {
			return;
		}

		register_block_type(
			$metadata_file,
			array(
				'render_callback' => array( __CLASS__, 'render' ),
			)
		);
	}

	/**
	 * Normalize the block attributes into the values the render uses.
	 *
	 * @param mixed $block_attributes Block attributes; anything but an array counts as none.
	 *
	 * @return array{layout: string, columns: int, per_page: int, order_by: string, show_description: bool, show_video_count: bool, pagination: string}
	 */
	public static function settings( $block_attributes ) {
		$block_attributes = is_array( $block_attributes ) ? $block_attributes : array();

		$pick  = function ( $key, $allowed ) use ( $block_attributes ) {
			return isset( $block_attributes[ $key ] ) && in_array( $block_attributes[ $key ], $allowed, true )
				? $block_attributes[ $key ]
				: $allowed[0];
		};
		$clamp = function ( $key, $min, $max, $default_value ) use ( $block_attributes ) {
			return isset( $block_attributes[ $key ] ) && is_numeric( $block_attributes[ $key ] )
				? max( $min, min( $max, (int) $block_attributes[ $key ] ) )
				: $default_value;
		};
		$flag  = function ( $key, $default_value ) use ( $block_attributes ) {
			return isset( $block_attributes[ $key ] ) ? (bool) $block_attributes[ $key ] : $default_value;
		};

		return array(
			'layout'           => $pick( 'layout', self::LAYOUTS ),
			'columns'          => $clamp( 'columns', self::MIN_COLUMNS, self::MAX_COLUMNS, self::DEFAULT_COLUMNS ),
			'per_page'         => $clamp( 'perPage', self::MIN_PER_PAGE, self::MAX_PER_PAGE, self::DEFAULT_PER_PAGE ),
			'order_by'         => $pick( 'orderBy', self::ORDERS ),
			'show_description' => $flag( 'showDescription', true ),
			'show_video_count' => $flag( 'showVideoCount', true ),
			'pagination'       => $pick( 'pagination', self::PAGINATIONS ),
		);
	}

	/**
	 * The indexed playlists in display order, each with its source post resolved.
	 *
	 * @param string $order_by One of ORDERS.
	 *
	 * @return array[] Records with `key`, `title`, `description`, `videos` and `post` (WP_Post|null).
	 */
	public static function ordered_playlists( $order_by ) {
		$playlists = array();
		$post_ids  = array();
		foreach ( Playlist_Index::get_playlists() as $key => $record ) {
			if ( ! is_array( $record ) ) {
				continue;
			}
			$post_id     = isset( $record['post_id'] ) ? absint( $record['post_id'] ) : 0;
			$playlists[] = array(
				'key'         => (string) $key,
				'title'       => isset( $record['title'] ) && is_string( $record['title'] ) ? $record['title'] : '',
				'description' => isset( $record['description'] ) && is_string( $record['description'] ) ? $record['description'] : '',
				'videos'      => isset( $record['videos'] ) && is_array( $record['videos'] ) ? $record['videos'] : array(),
				'post_id'     => $post_id,
				'post'        => null,
			);
			if ( $post_id ) {
				$post_ids[] = $post_id;
			}
		}

		if ( $post_ids ) {
			_prime_post_caches( array_unique( $post_ids ), false, false );
			foreach ( $playlists as &$playlist ) {
				$post = $playlist['post_id'] ? get_post( $playlist['post_id'] ) : null;
				if ( $post instanceof WP_Post && 'publish' === $post->post_status ) {
					$playlist['post'] = $post;
				}
			}
			unset( $playlist );
		}

		if ( 'title' === $order_by ) {
			usort(
				$playlists,
				function ( $a, $b ) {
					$result = strnatcasecmp( $a['title'], $b['title'] );
					return 0 !== $result ? $result : strcmp( $a['key'], $b['key'] );
				}
			);
		} else {
			// Newest first by the source post's publish date; playlists without a post go last.
			$date_of = function ( $playlist ) {
				return $playlist['post'] ? $playlist['post']->post_date_gmt : '';
			};
			usort(
				$playlists,
				function ( $a, $b ) use ( $date_of, $order_by ) {
					$date_a = $date_of( $a );
					$date_b = $date_of( $b );
					if ( '' === $date_a || '' === $date_b ) {
						$result = strcmp( $date_b, $date_a );
					} else {
						$result = 'newest' === $order_by ? strcmp( $date_b, $date_a ) : strcmp( $date_a, $date_b );
					}
					return 0 !== $result ? $result : strcmp( $a['key'], $b['key'] );
				}
			);
		}

		return $playlists;
	}

	/**
	 * The typography and color settings the Styles tab stores on the block, as
	 * CSS custom properties plus a marker class per property.
	 *
	 * Block supports put these on the wrapper, but headings inside it keep the
	 * theme's heading styles instead of inheriting, so the stylesheet applies the
	 * variables to the titles and the header heading only when a value is set.
	 *
	 * @param mixed $block_attributes Block attributes.
	 *
	 * @return array{classes: string[], style: string}
	 */
	public static function block_style_vars( $block_attributes ) {
		$block_attributes = is_array( $block_attributes ) ? $block_attributes : array();
		$style_attribute  = isset( $block_attributes['style'] ) && is_array( $block_attributes['style'] ) ? $block_attributes['style'] : array();
		$typography       = isset( $style_attribute['typography'] ) && is_array( $style_attribute['typography'] ) ? $style_attribute['typography'] : array();
		$color            = isset( $style_attribute['color'] ) && is_array( $style_attribute['color'] ) ? $style_attribute['color'] : array();

		$preset = function ( $type, $slug ) {
			return is_string( $slug ) && preg_match( '/^[a-z0-9-]+$/i', $slug )
				? 'var(--wp--preset--' . $type . '--' . strtolower( $slug ) . ')'
				: null;
		};

		$values = array(
			'font-family'     => $preset( 'font-family', $block_attributes['fontFamily'] ?? null ) ?? ( $typography['fontFamily'] ?? null ),
			'font-size'       => $preset( 'font-size', $block_attributes['fontSize'] ?? null ) ?? ( $typography['fontSize'] ?? null ),
			'font-style'      => $typography['fontStyle'] ?? null,
			'font-weight'     => $typography['fontWeight'] ?? null,
			'line-height'     => $typography['lineHeight'] ?? null,
			'letter-spacing'  => $typography['letterSpacing'] ?? null,
			'text-transform'  => $typography['textTransform'] ?? null,
			'text-decoration' => $typography['textDecoration'] ?? null,
			'color'           => $preset( 'color', $block_attributes['textColor'] ?? null ) ?? ( $color['text'] ?? null ),
		);

		$classes = array();
		$style   = '';
		foreach ( $values as $property => $value ) {
			$value = self::sanitize_style_value( $value );
			if ( null === $value ) {
				continue;
			}
			$classes[] = 'has-vpap-' . $property;
			$style    .= '--vpap-' . $property . ':' . $value . ';';
		}

		return array(
			'classes' => $classes,
			'style'   => $style,
		);
	}

	/**
	 * Keep a style value to what a font or color setting can hold: presets
	 * (including the `var:preset|type|slug` notation) and plain CSS values.
	 *
	 * @param mixed $value Raw attribute value.
	 *
	 * @return string|null The value, or null when it is empty or unsafe.
	 */
	private static function sanitize_style_value( $value ) {
		if ( is_int( $value ) || is_float( $value ) ) {
			$value = (string) $value;
		}
		if ( ! is_string( $value ) ) {
			return null;
		}

		$value = trim( $value );
		if ( preg_match( '/^var:preset\|([a-z0-9-]+)\|([a-z0-9-]+)$/i', $value, $matches ) ) {
			$value = 'var(--wp--preset--' . strtolower( $matches[1] ) . '--' . strtolower( $matches[2] ) . ')';
		}

		if ( '' === $value
			|| ! preg_match( '/^[A-Za-z0-9 ,.%#\/+"\'()-]+$/', $value )
			|| preg_match( '/(url|expression|image)\s*\(/i', $value )
		) {
			return null;
		}

		return $value;
	}

	/**
	 * The page a numbered pagination is showing, from the request.
	 *
	 * @return int 1-based page number.
	 */
	private static function requested_page() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only pagination argument, like core's paged.
		$page = isset( $_GET[ self::PAGE_QUERY_ARG ] ) ? absint( wp_unslash( $_GET[ self::PAGE_QUERY_ARG ] ) ) : 1;

		return max( 1, $page );
	}

	/**
	 * Render callback.
	 *
	 * @param array  $block_attributes Block attributes.
	 * @param string $content          The rendered inner blocks: the heading the user edits in the editor.
	 *
	 * @return string Block markup, or an empty string when the site has no playlists.
	 */
	public static function render( $block_attributes, $content = '' ) {
		$settings  = self::settings( $block_attributes );
		$playlists = self::ordered_playlists( $settings['order_by'] );
		$total     = count( $playlists );
		if ( ! $total ) {
			return '';
		}

		$per_page     = $settings['per_page'];
		$pages        = (int) ceil( $total / $per_page );
		$is_load_more = 'load-more' === $settings['pagination'];
		$current_page = $is_load_more ? 1 : min( $pages, self::requested_page() );

		$items = '';
		foreach ( $playlists as $index => $playlist ) {
			$page = (int) floor( $index / $per_page ) + 1;
			if ( ! $is_load_more && $page !== $current_page ) {
				continue;
			}
			$items .= self::render_item( $playlist, $settings, $page, $is_load_more && $page > 1 );
		}

		if ( $is_load_more ) {
			$shown   = min( $per_page, $total );
			$summary = sprintf(
				/* translators: 1: number of playlists shown. 2: number of playlists on the site. */
				__( 'Showing %1$s of %2$s', 'jetpack-videopress-pkg' ),
				number_format_i18n( $shown ),
				number_format_i18n( $total )
			);
			$pagination = $total > $shown ? self::render_load_more( $total - $shown, $per_page ) : '';
		} else {
			$summary = sprintf(
				/* translators: %s: number of playlists on the site. */
				_n( '%s playlist', '%s playlists', $total, 'jetpack-videopress-pkg' ),
				number_format_i18n( $total )
			);
			$pagination = $pages > 1 ? self::render_numbered_pagination( $current_page, $pages ) : '';
		}

		$style_vars = self::block_style_vars( $block_attributes );
		$classes    = array_merge(
			array(
				'videopress-all-playlists',
				'is-layout-' . $settings['layout'],
				'is-pagination-' . $settings['pagination'],
			),
			$style_vars['classes']
		);

		$wrapper_attributes = get_block_wrapper_attributes(
			array(
				'class'               => implode( ' ', $classes ),
				'style'               => '--vpap-columns:' . $settings['columns'] . ';' . $style_vars['style'],
				'data-playlist-total' => (string) $total,
				'data-per-page'       => (string) $per_page,
				/* translators: 1: number of playlists shown. 2: number of playlists on the site. */
				'data-summary'        => __( 'Showing %1$s of %2$s', 'jetpack-videopress-pkg' ),
			)
		);

		return sprintf(
			'<div %1$s>' .
				'<div class="videopress-all-playlists__header">%2$s<span class="videopress-all-playlists__summary">%3$s</span></div>' .
				'<ul class="videopress-all-playlists__items">%4$s</ul>%5$s' .
			'</div>',
			$wrapper_attributes,
			self::render_heading( $content ),
			esc_html( $summary ),
			$items,
			$pagination
		);
	}

	/**
	 * The header's heading: the core Heading block saved with the post, or a
	 * plain fallback for content saved before the heading became editable.
	 *
	 * @param string $content Rendered inner blocks.
	 *
	 * @return string Heading markup.
	 */
	private static function render_heading( $content ) {
		$content = is_string( $content ) ? trim( $content ) : '';
		if ( '' !== $content ) {
			return $content;
		}

		return sprintf(
			'<h2 class="videopress-all-playlists__heading">%s</h2>',
			esc_html__( 'Playlists', 'jetpack-videopress-pkg' )
		);
	}

	/**
	 * Render one playlist card.
	 *
	 * @param array $playlist A record from ordered_playlists().
	 * @param array $settings Normalized settings.
	 * @param int   $page     The page the card belongs to.
	 * @param bool  $hidden   Whether the card starts hidden, waiting for "Load more".
	 *
	 * @return string Card markup.
	 */
	private static function render_item( $playlist, $settings, $page, $hidden ) {
		$title       = '' !== $playlist['title'] ? $playlist['title'] : __( 'Untitled playlist', 'jetpack-videopress-pkg' );
		$permalink   = $playlist['post'] ? get_permalink( $playlist['post'] ) : '';
		$video_count = count( $playlist['videos'] );
		$first_guid  = $video_count && isset( $playlist['videos'][0]['guid'] ) && is_string( $playlist['videos'][0]['guid'] )
			? $playlist['videos'][0]['guid']
			: '';

		$item_classes   = array( 'videopress-all-playlists__item' );
		$item_classes[] = $first_guid ? 'is-poster-loading' : 'is-poster-missing';

		$badge = '';
		if ( $settings['show_video_count'] ) {
			$badge = sprintf(
				'<span class="videopress-all-playlists__badge"><span class="videopress-all-playlists__badge-icon" aria-hidden="true">≡</span>%s</span>',
				esc_html(
					sprintf(
						/* translators: %s: number of videos in the playlist. */
						_n( '%s video', '%s videos', $video_count, 'jetpack-videopress-pkg' ),
						number_format_i18n( $video_count )
					)
				)
			);
		}

		$poster = sprintf(
			'<span class="videopress-all-playlists__deck" aria-hidden="true"></span>' .
			'<span class="videopress-all-playlists__poster-frame">' .
				'<img class="videopress-all-playlists__poster-image" alt="" loading="lazy" hidden />' .
				'<span class="videopress-all-playlists__poster-missing">%1$s</span>%2$s' .
			'</span>',
			esc_html__( 'No poster available', 'jetpack-videopress-pkg' ),
			$badge
		);
		$poster = $permalink
			? sprintf(
				'<a class="videopress-all-playlists__poster" href="%1$s" aria-label="%2$s"%3$s>%4$s</a>',
				esc_url( $permalink ),
				esc_attr( $title ),
				$first_guid ? ' data-guid="' . esc_attr( $first_guid ) . '"' : '',
				$poster
			)
			: sprintf(
				'<span class="videopress-all-playlists__poster"%1$s>%2$s</span>',
				$first_guid ? ' data-guid="' . esc_attr( $first_guid ) . '"' : '',
				$poster
			);

		$body = sprintf(
			'<h3 class="videopress-all-playlists__title">%s</h3>',
			$permalink
				? sprintf( '<a href="%1$s">%2$s</a>', esc_url( $permalink ), esc_html( $title ) )
				: esc_html( $title )
		);
		if ( $settings['show_description'] && '' !== $playlist['description'] ) {
			$body .= sprintf( '<p class="videopress-all-playlists__description">%s</p>', esc_html( $playlist['description'] ) );
		}
		$body .= sprintf(
			'<span class="videopress-all-playlists__poster-note">%s</span>',
			esc_html__( 'First video is private or was deleted.', 'jetpack-videopress-pkg' )
		);
		if ( $permalink ) {
			$body .= sprintf(
				'<a class="videopress-all-playlists__link" href="%1$s">%2$s</a>',
				esc_url( $permalink ),
				esc_html__( 'View full playlist →', 'jetpack-videopress-pkg' )
			);
		}

		return sprintf(
			'<li class="%1$s" data-playlist="%2$s" data-page="%3$d"%4$s>%5$s<div class="videopress-all-playlists__body">%6$s</div></li>',
			esc_attr( implode( ' ', $item_classes ) ),
			esc_attr( $playlist['key'] ),
			$page,
			$hidden ? ' hidden' : '',
			$poster,
			$body
		);
	}

	/**
	 * Render the numbered pagination.
	 *
	 * @param int $current Current page.
	 * @param int $pages   Number of pages.
	 *
	 * @return string Pagination markup.
	 */
	private static function render_numbered_pagination( $current, $pages ) {
		$url_for = function ( $page ) {
			return 1 === $page
				? remove_query_arg( self::PAGE_QUERY_ARG )
				: add_query_arg( self::PAGE_QUERY_ARG, $page );
		};

		$links = $current > 1
			? sprintf(
				'<a class="videopress-all-playlists__page videopress-all-playlists__page--prev" href="%1$s">%2$s</a>',
				esc_url( $url_for( $current - 1 ) ),
				esc_html__( '← Previous', 'jetpack-videopress-pkg' )
			)
			: sprintf(
				'<span class="videopress-all-playlists__page videopress-all-playlists__page--prev is-disabled" aria-disabled="true">%s</span>',
				esc_html__( '← Previous', 'jetpack-videopress-pkg' )
			);

		for ( $page = 1; $page <= $pages; $page++ ) {
			$links .= $page === $current
				? sprintf(
					'<span class="videopress-all-playlists__page videopress-all-playlists__page--number is-current" aria-current="page">%d</span>',
					$page
				)
				: sprintf(
					'<a class="videopress-all-playlists__page videopress-all-playlists__page--number" href="%1$s">%2$d</a>',
					esc_url( $url_for( $page ) ),
					$page
				);
		}

		$links .= $current < $pages
			? sprintf(
				'<a class="videopress-all-playlists__page videopress-all-playlists__page--next" href="%1$s">%2$s</a>',
				esc_url( $url_for( $current + 1 ) ),
				esc_html__( 'Next →', 'jetpack-videopress-pkg' )
			)
			: sprintf(
				'<span class="videopress-all-playlists__page videopress-all-playlists__page--next is-disabled" aria-disabled="true">%s</span>',
				esc_html__( 'Next →', 'jetpack-videopress-pkg' )
			);

		return sprintf(
			'<nav class="videopress-all-playlists__pagination" aria-label="%1$s">%2$s</nav>',
			esc_attr__( 'Playlists pagination', 'jetpack-videopress-pkg' ),
			$links
		);
	}

	/**
	 * Render the "Load more" button.
	 *
	 * @param int $remaining Playlists not shown yet.
	 * @param int $per_page  Playlists revealed per click.
	 *
	 * @return string Button markup.
	 */
	private static function render_load_more( $remaining, $per_page ) {
		/* translators: %s: number of playlists the button reveals. */
		$label = __( 'Load %s more', 'jetpack-videopress-pkg' );

		return sprintf(
			'<div class="videopress-all-playlists__load-more"><button type="button" class="videopress-all-playlists__load-more-button" data-label="%1$s">%2$s</button></div>',
			esc_attr( $label ),
			esc_html( sprintf( $label, number_format_i18n( min( $remaining, $per_page ) ) ) )
		);
	}
}
