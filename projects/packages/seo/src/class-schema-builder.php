<?php
/**
 * JSON-LD Schema.org markup emitter.
 *
 * Outputs structured data in `<head>` for Article, Organization, FAQPage,
 * HowTo, and LocalBusiness types. Picks the per-post override when set,
 * otherwise falls back to sensible defaults by post type. Emission is
 * gated on `Jetpack_SEO_Utils::is_enabled_jetpack_seo()`.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Jetpack_SEO_Posts;
use Jetpack_SEO_Utils;
use WP_Post;

/**
 * Emits Schema.org JSON-LD into the document head.
 */
class Schema_Builder {

	const ORGANIZATION_OPTION = 'jetpack_seo_organization';

	/**
	 * Wire the wp_head emitter.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'wp_head', array( __CLASS__, 'emit' ), 5 );
	}

	/**
	 * Build and echo the JSON-LD block for the current request.
	 *
	 * @return void
	 */
	public static function emit() {
		if ( ! class_exists( 'Jetpack_SEO_Utils' ) || ! Jetpack_SEO_Utils::is_enabled_jetpack_seo() ) {
			return;
		}

		$graph = array();

		$organization = self::build_organization();
		if ( $organization ) {
			$graph[] = $organization;
		}

		if ( is_singular() ) {
			$post   = get_queried_object();
			$schema = self::build_for_post( $post );
			if ( $schema ) {
				$graph[] = $schema;
			}
		}

		if ( empty( $graph ) ) {
			return;
		}

		$doc = array(
			'@context' => 'https://schema.org',
			'@graph'   => $graph,
		);

		printf(
			'<script type="application/ld+json">%s</script>',
			wp_json_encode( $doc, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}

	/**
	 * Build the site-level Organization node.
	 *
	 * @return array|null
	 */
	private static function build_organization() {
		$org = get_option( self::ORGANIZATION_OPTION, array() );
		if ( ! is_array( $org ) ) {
			$org = array();
		}
		$name = $org['name'] ?? get_bloginfo( 'name' );
		if ( ! $name ) {
			return null;
		}

		$node = array(
			'@type' => 'Organization',
			'@id'   => home_url( '#organization' ),
			'name'  => $name,
			'url'   => home_url( '/' ),
		);
		if ( ! empty( $org['logo'] ) ) {
			$node['logo'] = (string) $org['logo'];
		}
		if ( ! empty( $org['same_as'] ) && is_array( $org['same_as'] ) ) {
			$node['sameAs'] = array_values( array_filter( array_map( 'esc_url_raw', $org['same_as'] ) ) );
		}
		return $node;
	}

	/**
	 * Build the JSON-LD for the queried post.
	 *
	 * @param WP_Post|null $post The queried post.
	 * @return array|null
	 */
	private static function build_for_post( $post ) {
		if ( ! ( $post instanceof WP_Post ) ) {
			return null;
		}

		$override = Jetpack_SEO_Posts::get_post_schema_type( $post );
		$type     = $override ? $override : self::default_schema_for_post( $post );

		switch ( $type ) {
			case 'faq':
				return self::build_faq( $post );
			case 'howto':
				return self::build_howto( $post );
			case 'localbusiness':
				return self::build_local_business( $post );
			case 'organization':
				// Already added as a standalone node; don't duplicate.
				return null;
			case 'article':
			default:
				return self::build_article( $post );
		}
	}

	/**
	 * Choose a default Schema type based on the post type when the user
	 * hasn't set an override.
	 *
	 * @param WP_Post $post The post.
	 * @return string
	 */
	private static function default_schema_for_post( WP_Post $post ) {
		if ( 'page' === $post->post_type ) {
			return '';
		}
		return 'article';
	}

	/**
	 * Article JSON-LD.
	 *
	 * @param WP_Post $post The post.
	 * @return array
	 */
	private static function build_article( WP_Post $post ) {
		$image = get_the_post_thumbnail_url( $post, 'full' );
		$node  = array(
			'@type'            => 'Article',
			'headline'         => wp_strip_all_tags( get_the_title( $post ) ),
			'datePublished'    => get_post_time( 'c', true, $post ),
			'dateModified'     => get_post_modified_time( 'c', true, $post ),
			'mainEntityOfPage' => array(
				'@type' => 'WebPage',
				'@id'   => get_permalink( $post ),
			),
			'author'           => array(
				'@type' => 'Person',
				'name'  => get_the_author_meta( 'display_name', $post->post_author ),
			),
		);
		if ( $image ) {
			$node['image'] = $image;
		}
		$description = Jetpack_SEO_Posts::get_post_description( $post );
		if ( $description ) {
			$node['description'] = wp_strip_all_tags( $description );
		}
		return $node;
	}

	/**
	 * FAQPage JSON-LD — parsed from `core/details` blocks.
	 *
	 * @param WP_Post $post The post.
	 * @return array|null
	 */
	private static function build_faq( WP_Post $post ) {
		if ( ! function_exists( 'parse_blocks' ) ) {
			return null;
		}
		$blocks = parse_blocks( $post->post_content );
		$items  = array();
		foreach ( $blocks as $block ) {
			if ( 'core/details' !== ( $block['blockName'] ?? '' ) ) {
				continue;
			}
			$summary = $block['attrs']['summary'] ?? '';
			$answer  = wp_strip_all_tags( render_block( $block ) );
			if ( ! $summary || ! $answer ) {
				continue;
			}
			$items[] = array(
				'@type'          => 'Question',
				'name'           => $summary,
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => trim( $answer ),
				),
			);
		}
		if ( empty( $items ) ) {
			return null;
		}
		return array(
			'@type'      => 'FAQPage',
			'mainEntity' => $items,
		);
	}

	/**
	 * HowTo JSON-LD — uses heading blocks as step names.
	 *
	 * @param WP_Post $post The post.
	 * @return array|null
	 */
	private static function build_howto( WP_Post $post ) {
		if ( ! function_exists( 'parse_blocks' ) ) {
			return null;
		}
		$blocks = parse_blocks( $post->post_content );
		$steps  = array();
		foreach ( $blocks as $block ) {
			if ( 'core/heading' === ( $block['blockName'] ?? '' ) ) {
				$steps[] = array(
					'@type' => 'HowToStep',
					'name'  => wp_strip_all_tags( render_block( $block ) ),
				);
			}
		}
		if ( empty( $steps ) ) {
			return null;
		}
		return array(
			'@type' => 'HowTo',
			'name'  => get_the_title( $post ),
			'step'  => $steps,
		);
	}

	/**
	 * LocalBusiness JSON-LD — draws from the saved organization option.
	 *
	 * @param WP_Post $post The post.
	 * @return array|null
	 */
	private static function build_local_business( WP_Post $post ) {
		unset( $post );
		$org = get_option( self::ORGANIZATION_OPTION, array() );
		if ( empty( $org['name'] ) ) {
			return null;
		}
		$node = array(
			'@type' => 'LocalBusiness',
			'name'  => (string) $org['name'],
			'url'   => home_url( '/' ),
		);
		foreach ( array( 'telephone', 'address', 'priceRange' ) as $key ) {
			if ( ! empty( $org[ $key ] ) ) {
				$node[ $key ] = $org[ $key ];
			}
		}
		return $node;
	}
}
