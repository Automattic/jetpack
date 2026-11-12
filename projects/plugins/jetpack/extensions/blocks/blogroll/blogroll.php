<?php
/**
 * Blogroll Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll;

require_once __DIR__ . '/blogroll-item/blogroll-item.php';

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Status\Request;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'render_callback'  => __NAMESPACE__ . '\load_assets',
			'provides_context' => array(
				'openLinksNewWindow' => 'open_links_new_window',
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blogroll block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Blogroll block attributes.
 * @param string $content String containing the Blogroll block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	global $wp;

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	$current_location = home_url( $wp->request );
	$is_wpcom         = ( defined( 'IS_WPCOM' ) && IS_WPCOM );

	$form_content = <<<HTML
		<form method="post" action="https://subscribe.wordpress.com" accept-charset="utf-8">
			<input name="action" type="hidden" value="subscribe">
			<input name="source" type="hidden" value="$current_location">
			<input name="sub-type" type="hidden" value="jetpack_blogroll">
			$content
		</form>
HTML;

	$blogroll_content = $is_wpcom && Request::is_frontend() ? $form_content : $content;

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$blogroll_content
	);
}

/**
 * Register site_recommendations settings
 *
 * @since 12.7
 */
function site_recommendations_settings() {
	register_setting(
		'general',
		'Blogroll Recommendations', // Visible to the user see: https://github.com/WordPress/gutenberg/issues/41637
		array(
			'description'   => __( 'Site Recommendations', 'jetpack' ),
			'type'          => 'array',
			'show_in_rest'  => array(
				'schema' => array(
					'items' => array(
						'type'       => 'object',
						'properties' => array(
							'id'                => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'name'              => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'icon'              => array(
								'type'   => 'string',
								'format' => 'uri',
							),
							'url'               => array(
								'type'   => 'string',
								'format' => 'uri',
							),
							'feed_url'          => array(
								'type'   => 'string',
								'format' => 'uri',
							),
							'description'       => array(
								'type'   => 'string',
								'format' => 'text-field',
							),
							'is_non_wpcom_site' => array(
								'type' => 'boolean',
							),
						),
					),
				),
			),
			'auth_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}

add_action( 'rest_api_init', __NAMESPACE__ . '\site_recommendations_settings' );

/**
 * Whether a post publishes its blogroll as OPML.
 *
 * @param \WP_Post|null $post Post object.
 * @return bool
 */
function has_opml( $post ) {
	return $post instanceof \WP_Post
		&& 'publish' === $post->post_status
		&& ! post_password_required( $post )
		&& has_block( 'jetpack/blogroll', $post );
}

/**
 * Collect the subscribable items of the blogroll blocks, including nested ones.
 *
 * Items without a feed URL cannot be subscribed to, so they are left out.
 *
 * @param array $blocks Parsed blocks.
 * @param array $items  Items found so far, keyed by feed URL.
 * @return array Items with `name`, `url` and `feed_url`, keyed by feed URL.
 */
function get_opml_items( $blocks, $items = array() ) {
	foreach ( $blocks as $block ) {
		if ( 'jetpack/blogroll-item' === $block['blockName'] && ! empty( $block['attrs']['feed_url'] ) ) {
			$feed_url = $block['attrs']['feed_url'];
			if ( ! isset( $items[ $feed_url ] ) ) {
				$items[ $feed_url ] = array(
					'name'     => wp_strip_all_tags( $block['attrs']['name'] ?? '' ),
					'url'      => $block['attrs']['url'] ?? '',
					'feed_url' => $feed_url,
				);
			}
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$items = get_opml_items( $block['innerBlocks'], $items );
		}
	}

	return $items;
}

/**
 * The blogroll of a post as an OPML document.
 *
 * @param \WP_Post $post Post object.
 * @return string OPML document.
 */
function get_opml( $post ) {
	$opml  = '<?xml version="1.0" encoding="' . esc_attr( get_option( 'blog_charset' ) ) . '"?>' . "\n";
	$opml .= '<opml version="2.0">' . "\n";
	$opml .= "\t<head>\n";
	$opml .= "\t\t<title>" . esc_xml( get_the_title( $post ) ) . "</title>\n";
	$opml .= "\t</head>\n";
	$opml .= "\t<body>\n";

	foreach ( get_opml_items( parse_blocks( $post->post_content ) ) as $item ) {
		$opml .= sprintf(
			"\t\t" . '<outline type="rss" text="%1$s" xmlUrl="%2$s" htmlUrl="%3$s" />' . "\n",
			esc_xml( $item['name'] ),
			esc_url( $item['feed_url'] ),
			esc_url( $item['url'] )
		);
	}

	$opml .= "\t</body>\n";
	$opml .= '</opml>' . "\n";

	return $opml;
}

/**
 * Serve the blogroll of the current post as OPML on `?opml`.
 */
function serve_opml() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- A public, read-only file; a bare ?opml has an empty value, so test presence.
	if ( ! isset( $_GET['opml'] ) || ! is_singular() || ! has_opml( get_queried_object() ) ) {
		return;
	}

	header( 'Content-Type: text/x-opml; charset=' . get_option( 'blog_charset' ) );
	echo get_opml( get_queried_object() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in get_opml().
	exit( 0 );
}
add_action( 'template_redirect', __NAMESPACE__ . '\serve_opml' );

/**
 * Print the rel="blogroll" discovery link on a post with a blogroll.
 */
function print_opml_link() {
	if ( ! is_singular() || ! has_opml( get_queried_object() ) ) {
		return;
	}

	printf(
		'<link rel="blogroll" type="text/x-opml" title="%1$s" href="%2$s" />' . "\n",
		esc_attr( get_the_title( get_queried_object() ) ),
		esc_url( add_query_arg( 'opml', '', get_permalink( get_queried_object() ) ) )
	);
}
add_action( 'wp_head', __NAMESPACE__ . '\print_opml_link' );
