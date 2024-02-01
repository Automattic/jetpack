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
	const PATTERN_NAMESPACE = 'a8c/';

	/**
	 * Patterns source sites. A array of strings, each of which matches a valid source for retrieving patterns.
	 *
	 * @var array
	 */
	private $patterns_sources;

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
	public function __construct( Wpcom_Block_Patterns_Utils $utils = null ) {
		$this->patterns_sources = array( 'block_patterns' );

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

		// For every pattern source site, fetch the patterns.
		foreach ( $this->patterns_sources as $patterns_source ) {
			$patterns_cache_key = $this->utils->get_patterns_cache_key( $patterns_source );

			$pattern_categories = array();
			$block_patterns     = $this->get_patterns( $patterns_cache_key, $patterns_source );

			foreach ( (array) $block_patterns as $pattern ) {
				foreach ( (array) $pattern['categories'] as $slug => $category ) {
					// Register categories from first pattern in each category.
					if ( ! isset( $pattern_categories[ $slug ] ) ) {
						$pattern_categories[ $slug ] = array(
							'label'       => $category['title'],
							'description' => $category['description'],
						);
					}
				}
			}

			// Unregister existing categories so that we can insert them in the desired order (alphabetically).
			$existing_categories = array();
			foreach ( \WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered() as $existing_category ) {
				$existing_categories[ $existing_category['name'] ] = $existing_category;
				unregister_block_pattern_category( $existing_category['name'] );
			}

			// Existing categories are registered in Gutenberg or other plugins.
			// We overwrite them with the categories from Dotcom patterns.
			$pattern_categories = array_merge( $existing_categories, $pattern_categories );

			// Order categories alphabetically by their label.
			uasort(
				$pattern_categories,
				function ( $a, $b ) {
					return strnatcasecmp( $a['label'], $b['label'] );
				}
			);

			// Move the Featured category to be the first category.
			if ( isset( $pattern_categories['featured'] ) ) {
				$featured_category  = $pattern_categories['featured'];
				$pattern_categories = array( 'featured' => $featured_category ) + $pattern_categories;
			}

			// Register categories (and re-register existing categories).
			foreach ( (array) $pattern_categories as $slug => &$category_properties ) {
				// Rename category labels.
				if ( 'posts' === $slug ) {
					$category_properties['label'] = __(
						'Blog Posts',
						'jetpack-mu-wpcom'
					);
				}
				register_block_pattern_category( $slug, $category_properties );
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
		}

		$this->update_pattern_block_types();

		// Temporarily removing the call to `update_pattern_post_types` while we investigate
		// https://github.com/Automattic/wp-calypso/issues/79145.

		return $results;
	}

	/**
	 * Returns a list of patterns.
	 *
	 * @param string $patterns_cache_key Key to store responses to and fetch responses from cache.
	 * @param string $patterns_source    Slug for valid patterns source site, e.g., `block_patterns`.
	 * @return array                      The list of translated patterns.
	 */
	private function get_patterns( $patterns_cache_key, $patterns_source ) {
		$override_source_site = apply_filters( 'a8c_override_patterns_source_site', false );
		if ( $override_source_site ) {
			// Skip caching and request all patterns from a specified source site.
			// This allows testing patterns in development with immediate feedback
			// while avoiding polluting the cache. Note that this request gets
			// all patterns on the source site, not just those with the 'pattern' tag.
			$request_url = esc_url_raw(
				add_query_arg(
					array(
						'site'         => $override_source_site,
						'tags'         => 'pattern',
						'pattern_meta' => 'is_web',
					),
					'https://public-api.wordpress.com/rest/v1/ptk/patterns/' . $this->utils->get_block_patterns_locale()
				)
			);

			return $this->utils->remote_get( $request_url );
		}

		$block_patterns = $this->utils->cache_get( $patterns_cache_key, 'ptk_patterns' );

		// Enable testing v2 patterns on sites with Assembler theme active
		$enable_testing_v2_patterns = in_array( get_stylesheet(), array( 'pub/assembler', 'assembler' ), true );

		// Load fresh data if we don't have any patterns.
		if ( $enable_testing_v2_patterns || false === $block_patterns || ( defined( 'WP_DISABLE_PATTERN_CACHE' ) && WP_DISABLE_PATTERN_CACHE ) ) {
			if ( $enable_testing_v2_patterns ) {
				$request_params = array(
					'site'      => 'dotcompatterns.wordpress.com',
					'post_type' => 'wp_block',
				);
			}
			$request_url = esc_url_raw(
				add_query_arg(
					$request_params ?? array(
						'tags'            => 'pattern',
						'pattern_meta'    => 'is_web',
						'patterns_source' => $patterns_source,
					),
					'https://public-api.wordpress.com/rest/v1/ptk/patterns/' . $this->utils->get_block_patterns_locale()
				)
			);

			$block_patterns = $this->utils->remote_get( $request_url );

			if ( ! $enable_testing_v2_patterns ) {
				$this->utils->cache_add( $patterns_cache_key, $block_patterns, 'ptk_patterns', DAY_IN_SECONDS );
			}
		}

		return $block_patterns;
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

	/**
	 * Ensure that all patterns with a blockType property are registered with appropriate postTypes.
	 */
	private function update_pattern_block_types() {
		if ( ! class_exists( 'WP_Block_Patterns_Registry' ) ) {
			return;
		}
		foreach ( \WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
			if ( ! array_key_exists( 'blockTypes', $pattern ) || empty( $pattern['blockTypes'] ) ) {
				continue;
			}

			$post_content_offset = array_search( 'core/post-content', $pattern['blockTypes'], true );
			if ( $post_content_offset !== false ) {
				unregister_block_pattern( $pattern['name'] );

				array_splice( $pattern['blockTypes'], $post_content_offset, 1 );
				$pattern_name = $pattern['name'];
				unset( $pattern['name'] );
				register_block_pattern( $pattern_name, $pattern );
			}
		}
	}
}
