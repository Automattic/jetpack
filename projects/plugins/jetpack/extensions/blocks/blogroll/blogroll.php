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
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
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
		&& ( has_block( 'jetpack/blogroll', $post ) || has_block( 'core/block', $post ) )
		&& get_opml_items( get_public_blocks( $post ) );
}

/**
 * The blocks of a post that every visitor can see, so gated blogrolls stay out of the OPML.
 *
 * Mirrors add_paywall(): a gated post is public only above its Paywall block.
 *
 * @param \WP_Post $post Post object.
 * @return array Parsed blocks.
 */
function get_public_blocks( $post ) {
	$blocks = parse_blocks( $post->post_content );
	if ( ! has_filter( 'the_content', 'Automattic\Jetpack\Extensions\Subscriptions\add_paywall' ) ) {
		return $blocks;
	}

	require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
	if ( Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY === \Jetpack_Memberships::get_post_access_level( $post->ID ) ) {
		return $blocks;
	}

	foreach ( $blocks as $i => $block ) {
		if ( 'jetpack/paywall' === $block['blockName'] ) {
			return array_slice( $blocks, 0, $i );
		}
	}
	return array();
}

/**
 * The current post, if it publishes its blogroll as OPML.
 *
 * @return \WP_Post|null
 */
function get_opml_post() {
	$post = is_singular() ? get_queried_object() : null;
	return has_opml( $post ) ? $post : null;
}

/**
 * An absolute http(s) URL from a block attribute, or an empty string.
 *
 * An OPML file has no base URL, so a relative URL cannot be resolved by a reader.
 *
 * @param mixed $url Attribute value.
 * @return string
 */
function get_opml_url( $url ) {
	$url   = is_string( $url ) ? esc_url_raw( $url, array( 'http', 'https' ) ) : '';
	$parts = wp_parse_url( $url );
	return ! empty( $parts['scheme'] ) && ! empty( $parts['host'] ) ? $url : '';
}

/**
 * Collect the subscribable items of the blogroll blocks, including nested ones and synced patterns.
 *
 * Items without a feed URL cannot be subscribed to, so they are left out.
 *
 * @param array $blocks Parsed blocks.
 * @param array $items  Items found so far, keyed by normalized feed URL.
 * @param int[] $refs   Synced patterns already followed, so a pattern that includes itself ends.
 * @return array Items with `name`, `url` and `feed_url`, keyed by normalized feed URL.
 */
function get_opml_items( $blocks, $items = array(), $refs = array() ) {
	foreach ( $blocks as $block ) {
		// Only rendered for subscribers, see render_subscriber_view_block().
		if ( 'premium-content/subscriber-view' === $block['blockName'] ) {
			continue;
		}

		$feed_url = 'jetpack/blogroll-item' === $block['blockName'] ? get_opml_url( $block['attrs']['feed_url'] ?? '' ) : '';
		// The same feed with another scheme or without the trailing slash is listed once.
		$key = untrailingslashit( set_url_scheme( $feed_url, 'https' ) );
		if ( '' !== $feed_url && ! isset( $items[ $key ] ) ) {
			$items[ $key ] = array(
				'name'     => is_string( $block['attrs']['name'] ?? '' ) ? wp_strip_all_tags( $block['attrs']['name'] ?? '' ) : '',
				'url'      => get_opml_url( $block['attrs']['url'] ?? '' ),
				'feed_url' => $feed_url,
			);
		}

		$ref = 'core/block' === $block['blockName'] ? (int) ( $block['attrs']['ref'] ?? 0 ) : 0;
		if ( $ref && ! in_array( $ref, $refs, true ) ) {
			$pattern = get_post( $ref );
			if ( $pattern instanceof \WP_Post && 'wp_block' === $pattern->post_type && 'publish' === $pattern->post_status ) {
				$items = get_opml_items( parse_blocks( $pattern->post_content ), $items, array_merge( $refs, array( $ref ) ) );
			}
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$items = get_opml_items( $block['innerBlocks'], $items, $refs );
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
	$opml .= "\t\t<title>" . esc_xml( wp_strip_all_tags( get_the_title( $post ) ) ) . "</title>\n";
	$opml .= "\t</head>\n";
	$opml .= "\t<body>\n";

	foreach ( get_opml_items( get_public_blocks( $post ) ) as $item ) {
		$opml .= sprintf(
			"\t\t" . '<outline type="rss" text="%1$s" xmlUrl="%2$s"%3$s />' . "\n",
			esc_xml( $item['name'] ),
			esc_url( $item['feed_url'] ),
			$item['url'] ? ' htmlUrl="' . esc_url( $item['url'] ) . '"' : ''
		);
	}

	$opml .= "\t</body>\n";
	$opml .= '</opml>' . "\n";

	return $opml;
}

/**
 * Serve the blogroll of the current post as OPML on `?opml`.
 *
 * @param string $template Template to load.
 * @return string
 */
function serve_opml( $template ) {
	// Not a query var: any extra query var stops WP_Query from resolving a static front page.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only, public document.
	$post = isset( $_GET['opml'] ) ? get_opml_post() : null;
	if ( ! $post ) {
		return $template;
	}

	header( 'Content-Type: text/x-opml; charset=' . get_option( 'blog_charset' ) );
	header( 'X-Robots-Tag: noindex' );
	echo get_opml( $post ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped in get_opml().
	exit( 0 );
}
// Last, after redirect_canonical() and template gates like Coming Soon.
add_filter( 'template_include', __NAMESPACE__ . '\serve_opml', PHP_INT_MAX );

/**
 * Print the rel="blogroll" discovery link on a post with a blogroll.
 */
function print_opml_link() {
	$post = get_opml_post();
	if ( ! $post ) {
		return;
	}

	printf(
		'<link rel="blogroll" type="text/x-opml" title="%1$s" href="%2$s" />' . "\n",
		esc_attr( wp_strip_all_tags( get_the_title( $post ) ) ),
		esc_url( add_query_arg( 'opml', '', get_permalink( $post ) ) )
	);
}
add_action( 'wp_head', __NAMESPACE__ . '\print_opml_link' );
