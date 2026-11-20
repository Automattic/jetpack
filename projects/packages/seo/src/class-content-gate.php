<?php
/**
 * Whether a post's body is withheld from the public by a content gate.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Whether a post's body is withheld from an anonymous reader.
 *
 * Crawler-facing surfaces (meta descriptions, Open Graph tags, JSON-LD, llms.txt)
 * read the raw `post_content` column, so they never pass through the `the_content`
 * chain where the subscriptions paywall is installed and must ask this themselves.
 *
 * Visitor-independent by design: those surfaces are cached and shared, so their
 * output must not vary by who fetched them.
 *
 * @since 0.9.2
 */
class Content_Gate {

	/**
	 * Post meta set when a post contains paid content.
	 *
	 * @var string
	 */
	const META_CONTAINS_PAID_CONTENT = '_jetpack_memberships_contains_paid_content';

	/**
	 * Post meta set when a post contains paywalled content.
	 *
	 * @var string
	 */
	const META_CONTAINS_PAYWALLED_CONTENT = '_jetpack_memberships_contains_paywalled_content';

	/**
	 * Post meta holding the post-level Newsletter access setting.
	 *
	 * @var string
	 */
	const META_NEWSLETTER_ACCESS = '_jetpack_newsletter_access';

	/**
	 * The access level that means "no gate".
	 *
	 * @var string
	 */
	const ACCESS_LEVEL_EVERYBODY = 'everybody';

	/**
	 * The block that splits a post into a public teaser and a gated body.
	 *
	 * @var string
	 */
	const BLOCK_PAYWALL = 'jetpack/paywall';

	/**
	 * The namespace whose blocks hide their own content at render time.
	 *
	 * @var string
	 */
	const BLOCK_NAMESPACE_PREMIUM_CONTENT = 'premium-content';

	/**
	 * The block that wraps gated content.
	 *
	 * @var string
	 */
	const BLOCK_PREMIUM_CONTENT = self::BLOCK_NAMESPACE_PREMIUM_CONTENT . '/container';

	/**
	 * Whether this post's body is withheld from an anonymous reader.
	 *
	 * Any Newsletter access level other than "everybody" counts as gated, even one
	 * the front end would not enforce (an unknown value, or the Subscriptions
	 * module switched off after the level was set). Erring that way withholds a
	 * summary; erring the other way publishes a paywalled body.
	 *
	 * @since 0.9.2
	 *
	 * @param \WP_Post|int|null $post Post, post ID, or null for the global post.
	 * @return bool True when the body must not be published.
	 */
	public static function is_gated( $post = null ) {
		// A WP_Post is taken as given: get_post() would re-query it by ID.
		$post = $post instanceof \WP_Post ? $post : get_post( $post );

		if ( ! $post instanceof \WP_Post ) {
			return true;
		}

		if ( ! empty( $post->post_password ) ) {
			return true;
		}

		if (
			get_post_meta( $post->ID, self::META_CONTAINS_PAID_CONTENT, true )
			|| get_post_meta( $post->ID, self::META_CONTAINS_PAYWALLED_CONTENT, true )
			|| has_block( self::BLOCK_PREMIUM_CONTENT, $post )
			|| has_block( self::BLOCK_PAYWALL, $post )
		) {
			return true;
		}

		return self::ACCESS_LEVEL_EVERYBODY !== self::access_level( $post->ID );
	}

	/**
	 * The part of a gated post's body that is published to everyone anyway.
	 *
	 * A `jetpack/paywall` post serves everything above the block to anonymous
	 * readers, but only because `do_blocks()` then renders that prefix: a
	 * `premium-content` block inside it hides itself, which raw markup does not.
	 *
	 * @since 0.9.2
	 *
	 * @param \WP_Post|int|null $post Post, post ID, or null for the global post.
	 * @return string Public teaser, or '' when no part of the body is public.
	 */
	public static function public_teaser( $post = null ) {
		$post = $post instanceof \WP_Post ? $post : get_post( $post );

		if ( ! $post instanceof \WP_Post || ! empty( $post->post_password ) ) {
			return '';
		}

		// Split on the same delimiter the subscriptions paywall splits on, so the
		// teaser we summarize is the one the front end actually serves.
		$delimiter = '<!-- wp:' . self::BLOCK_PAYWALL . ' /-->';
		if ( ! str_contains( $post->post_content, $delimiter ) ) {
			return '';
		}

		$teaser = strstr( $post->post_content, $delimiter, true );

		// Callers summarize this without rendering it, so a block that withholds
		// its own content at render time would publish here as plain text.
		if ( str_contains( $teaser, '<!-- wp:' . self::BLOCK_NAMESPACE_PREMIUM_CONTENT . '/' ) ) {
			return '';
		}

		return $teaser;
	}

	/**
	 * The post's Newsletter access level.
	 *
	 * Unset and non-string values read as "everybody", as the front end treats
	 * them, so a post the site renders in full keeps its summary.
	 *
	 * @param int $post_id Post ID.
	 * @return string
	 */
	private static function access_level( $post_id ) {
		$access_level = get_post_meta( $post_id, self::META_NEWSLETTER_ACCESS, true );

		if ( empty( $access_level ) || ! is_string( $access_level ) ) {
			return self::ACCESS_LEVEL_EVERYBODY;
		}

		return $access_level;
	}
}
