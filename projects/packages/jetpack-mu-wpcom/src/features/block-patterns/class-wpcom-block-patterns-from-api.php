<?php
/**
 * Class Wpcom Block Patterns From Api
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Require the utils class.
 */
require_once __DIR__ . '/class-wpcom-block-patterns-utils.php';

/**
 * Class Wpcom_Block_Patterns_From_Api
 */
class Wpcom_Block_Patterns_From_Api {
	const PATTERN_NAMESPACE             = 'a8c/';
	const GUTENPEN_PATTERNS_SOURCE_SITE = 'gutenpenpatternsourcesite.wordpress.com';

	/**
	 * A collection of utility methods.
	 *
	 * @var Wpcom_Block_Patterns_Utils
	 */
	private $utils;

	/**
	 * Block_Patterns constructor.
	 *
	 * @param Wpcom_Block_Patterns_Utils|null $utils       A class dependency containing utils methods.
	 */
	public function __construct( ?Wpcom_Block_Patterns_Utils $utils = null ) {
		$this->utils = empty( $utils ) ? new Wpcom_Block_Patterns_Utils() : $utils;
	}

	/**
	 * Register FSE block patterns and categories.
	 *
	 * @return array Results of pattern registration.
	 */
	public function register_patterns() {
		// Used to track which patterns we successfully register.
		$results = array();

		$patterns_cache_key = $this->utils->get_patterns_cache_key();

		$pattern_categories = array();
		$block_patterns     = $this->get_patterns( $patterns_cache_key );
		$block_patterns     = array_merge( $block_patterns, $this->get_gutenpen_patterns() );

		// Register categories from first pattern in each category.
		foreach ( (array) $block_patterns as $pattern ) {
			foreach ( (array) $pattern['categories'] as $slug => $category ) {
				// Skip categories that start with an underscore
				$is_hidden_category = substr( $slug, 0, 1 ) === '_';

				if ( ! isset( $pattern_categories[ $slug ] ) && ! $is_hidden_category ) {
					$pattern_categories[ $slug ] = array(
						'label'       => $category['title'],
						'description' => $category['description'],
					);

					// Unregister first to overwrite any existent categories
					unregister_block_pattern_category( $slug );
					register_block_pattern_category(
						$slug,
						$pattern_categories[ $slug ]
					);
				}
			}
		}

		foreach ( (array) $block_patterns as &$pattern ) {
			if ( $this->can_register_pattern( $pattern ) ) {
				$is_premium = isset( $pattern['pattern_meta']['is_premium'] ) ? boolval( $pattern['pattern_meta']['is_premium'] ) : false;

				// Set custom viewport width for the pattern preview with a
				// default width of 1280 and ensure a safe minimum width of 320.
				$viewport_width = isset( $pattern['pattern_meta']['viewport_width'] ) ? intval( $pattern['pattern_meta']['viewport_width'] ) : 1280;
				$viewport_width = $viewport_width < 320 ? 320 : $viewport_width;
				$pattern_name   = self::PATTERN_NAMESPACE . $pattern['name'];
				$block_types    = $this->utils->maybe_get_pattern_block_types_from_pattern_meta( $pattern );
				if ( empty( $block_types ) ) {
					// For wp_block patterns because don't use pattern meta for block types.
					$block_types = $this->utils->get_block_types_from_categories( $pattern );
				}

				$results[ $pattern_name ] = register_block_pattern(
					$pattern_name,
					array(
						'title'         => $pattern['title'],
						'description'   => $pattern['description'],
						'content'       => $pattern['html'],
						'viewportWidth' => $viewport_width,
						'categories'    => array_keys(
							$pattern['categories']
						),
						'isPremium'     => $is_premium,
						'blockTypes'    => $block_types,
					)
				);
			}
		}

		// Temporarily removing the call to `update_pattern_post_types` while we investigate
		// https://github.com/Automattic/wp-calypso/issues/79145.

		return $results;
	}

	/**
	 * Returns a list of patterns.
	 *
	 * @param string $patterns_cache_key Key to store responses to and fetch responses from cache.
	 * @param string $source_site        Source site ID or domain.
	 * @return array The list of patterns.
	 */
	private function get_patterns( $patterns_cache_key, $source_site = 'dotcompatterns.wordpress.com' ) {
		$override_source_site = apply_filters( 'a8c_override_patterns_source_site', null );

		$block_patterns = $this->utils->cache_get( $patterns_cache_key, 'ptk_patterns' );
		$disable_cache  = ( function_exists( 'is_automattician' ) && is_automattician() ) || $override_source_site || ( defined( 'WP_DISABLE_PATTERN_CACHE' ) && WP_DISABLE_PATTERN_CACHE );

		// Load fresh data if is automattician or we don't have any data.
		if ( $disable_cache || false === $block_patterns ) {
			$request_url = esc_url_raw(
				add_query_arg(
					array(
						'site'      => $override_source_site ?? $source_site,
						'post_type' => 'wp_block',
					),
					'https://public-api.wordpress.com/rest/v1/ptk/patterns/' . $this->utils->get_block_patterns_locale()
				)
			);

			$block_patterns = $this->utils->remote_get( $request_url );

			// Only save to cache when is not disabled.
			if ( ! $disable_cache ) {
				$this->utils->cache_add( $patterns_cache_key, $block_patterns, 'ptk_patterns', 5 * MINUTE_IN_SECONDS );
			}
		}

		return $block_patterns;
	}

	/**
	 * Returns the list of GutenPen patterns for the current user.
	 *
	 * GutenPen patterns are scoped to the requesting user, so the request must be signed/dispatched
	 * as the current user (see Wpcom_Block_Patterns_Utils::remote_get_as_user). On Simple sites we
	 * additionally short-circuit users who have never used the feature, based on the
	 * `is_gutenpen_user` user attribute, to avoid an unnecessary API call.
	 *
	 * @return array The list of GutenPen patterns, or an empty array when the feature is unavailable to the current user.
	 */
	private function get_gutenpen_patterns() {
		// On Simple sites, only users marketed as GutenPen users may have patterns to fetch.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && ! get_user_attribute( get_current_user_id(), 'is_gutenpen_user' ) ) {
			return array();
		}

		$cache_key            = sprintf( 'gutenpen_patterns_%d', get_current_user_id() );
		$override_source_site = apply_filters( 'a8c_override_patterns_source_site', null );

		$patterns      = $this->utils->cache_get( $cache_key, 'ptk_patterns' );
		$disable_cache = ( function_exists( 'is_automattician' ) && is_automattician() ) || $override_source_site || ( defined( 'WP_DISABLE_PATTERN_CACHE' ) && WP_DISABLE_PATTERN_CACHE );

		if ( $disable_cache || false === $patterns ) {
			$patterns = $this->utils->remote_get_as_user( '/gutenpen/patterns' );

			if ( ! $disable_cache ) {
				$this->utils->cache_add( $cache_key, $patterns, 'ptk_patterns', 5 * MINUTE_IN_SECONDS );
			}
		}

		return $patterns;
	}

	/**
	 * Check that the pattern is allowed to be registered.
	 *
	 * Checks for pattern_meta tags with a prefix of `requires-` in the name, and then attempts to match
	 * the remainder of the name to a theme feature.
	 *
	 * For example, to prevent patterns that depend on wide or full-width block alignment support
	 * from being registered in sites where the active theme does not have `align-wide` support,
	 * we can add the `requires-align-wide` pattern_meta tag to the pattern. This function will
	 * then match against that pattern_meta tag, and then return `false`.
	 *
	 * @param array $pattern    A pattern with a 'pattern_meta' array where the key is the tag slug in English.
	 *
	 * @return bool
	 */
	private function can_register_pattern( $pattern ) {
		if ( empty( $pattern['pattern_meta'] ) ) {
			// Default to allowing patterns without metadata to be registered.
			return true;
		}

		foreach ( $pattern['pattern_meta'] as $pattern_meta => $value ) {
			// Match against tags with a non-translated slug beginning with `requires-`.
			$split_slug = preg_split( '/^requires-/', $pattern_meta );

			// If the theme does not support the matched feature, then skip registering the pattern.
			if ( isset( $split_slug[1] ) && false === get_theme_support( $split_slug[1] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Ensure that all patterns with a blockType property are registered with appropriate postTypes.
	 */
	private function update_pattern_post_types() {
		if ( ! class_exists( 'WP_Block_Patterns_Registry' ) ) {
			return;
		}
		foreach ( \WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
			if ( array_key_exists( 'postTypes', $pattern ) && $pattern['postTypes'] ) {
				continue;
			}

			$post_types = $this->utils->get_pattern_post_types_from_pattern( $pattern );
			if ( $post_types ) {
				unregister_block_pattern( $pattern['name'] );

				$pattern['postTypes'] = $post_types;
				$pattern_name         = $pattern['name'];
				unset( $pattern['name'] );
				register_block_pattern( $pattern_name, $pattern );
			}
		}
	}
}
