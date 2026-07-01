<?php
/**
 * Per-post Schema.org node builder.
 *
 * Builds the page-level JSON-LD node for the queried singular post: Article (the
 * default for standard posts) and FAQPage (when the post uses `core/details`
 * blocks). The type follows the per-post `jetpack_seo_schema_type` override when
 * set, otherwise a sensible default by post type. Returns an array node or null
 * when the post should not emit structured data, so the graph can skip it.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Jetpack_SEO_Posts;
use WP_Post;

/**
 * Builds the Article / FAQPage node for a single post.
 */
class Post_Schema_Node {

	/**
	 * Max words kept for a schema `description`, so a long post body doesn't
	 * dump its full content into the markup.
	 */
	const DESCRIPTION_MAX_WORDS = 55;

	/**
	 * Build the JSON-LD node for the queried post, or null when none applies.
	 *
	 * @param WP_Post|null $post The queried post.
	 * @return array|null
	 */
	public static function build( $post ) {
		if ( ! ( $post instanceof WP_Post ) ) {
			return null;
		}

		// Only emit structured data for published content. Previews, drafts, and
		// private posts are viewable by logged-in users (and may be edge-cached),
		// so we must not output JSON-LD for anything that isn't publicly published.
		if ( 'publish' !== $post->post_status ) {
			return null;
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Posts lives in plugins/jetpack; Schema_Builder::emit() guards on class_exists.
		$override = Jetpack_SEO_Posts::get_post_schema_type( $post );
		$type     = '' !== $override ? $override : self::default_schema_for_post( $post );

		switch ( $type ) {
			case 'faq':
				return self::build_faq( $post );
			case 'article':
				return self::build_article( $post );
			default:
				return null;
		}
	}

	/**
	 * Default Schema type for a post when the user has not set an override:
	 * Article for standard posts, none for pages, attachments, or custom types.
	 *
	 * @param WP_Post $post The post.
	 * @return string
	 */
	private static function default_schema_for_post( WP_Post $post ) {
		// Only standard posts get Article schema by default; everything else
		// (pages, attachments, custom post types) requires an explicit override.
		return 'post' === $post->post_type ? 'article' : '';
	}

	/**
	 * Article JSON-LD.
	 *
	 * @param WP_Post $post The post.
	 * @return array
	 */
	private static function build_article( WP_Post $post ) {
		$node = array(
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
				'name'  => get_the_author_meta( 'display_name', (int) $post->post_author ),
			),
		);

		$image = get_the_post_thumbnail_url( $post, 'full' );
		if ( $image ) {
			$node['image'] = $image;
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Posts lives in plugins/jetpack; Schema_Builder::emit() guards on class_exists.
		$description = Jetpack_SEO_Posts::get_post_description( $post );
		if ( $description ) {
			// Cap it: get_post_description() falls back to full post_content, which
			// would otherwise dump the whole body into the markup.
			$node['description'] = wp_trim_words( wp_strip_all_tags( $description ), self::DESCRIPTION_MAX_WORDS, '' );
		}

		return $node;
	}

	/**
	 * FAQPage JSON-LD, parsed from `core/details` blocks (summary = question,
	 * rendered content = answer). Returns null when the post has none, so we
	 * never emit an empty/invalid FAQPage.
	 *
	 * @param WP_Post $post The post.
	 * @return array|null
	 */
	private static function build_faq( WP_Post $post ) {
		if ( ! function_exists( 'parse_blocks' ) ) {
			return null;
		}

		$items = array();
		foreach ( parse_blocks( $post->post_content ) as $block ) {
			if ( 'core/details' !== ( $block['blockName'] ?? '' ) ) {
				continue;
			}
			$question = trim( (string) ( $block['attrs']['summary'] ?? '' ) );

			// Render only the inner blocks for the answer. Rendering the whole
			// core/details block would re-include the <summary> (the question).
			$answer_html = '';
			foreach ( $block['innerBlocks'] ?? array() as $inner_block ) {
				$answer_html .= render_block( $inner_block );
			}
			$answer = trim( wp_strip_all_tags( $answer_html ) );
			if ( '' === $question || '' === $answer ) {
				continue;
			}
			$items[] = array(
				'@type'          => 'Question',
				'name'           => $question,
				'acceptedAnswer' => array(
					'@type' => 'Answer',
					'text'  => $answer,
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
}
