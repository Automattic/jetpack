<?php
/**
 * Functions to read WooCommerce terms and taxonomy information from
 * a theme's headstart annotation, then apply them to the site.
 * To be used after WooCommerce is installed.
 *
 * @package wpcomsh
 */

/**
 * Main function for applying all term and taxonomy information from
 * the current theme's headstart annotation.
 *
 * @return array $results An associative array. Key 'missing_taxonomies' has an array value: if there were terms in the annotation that could not be added because a taxonomy was missing on the site, the list of missing taxonomies. (An array of strings).
 */
function wpcomsh_apply_headstart_terms() {
	$theme           = wp_get_theme();
	$theme_name      = $theme->get_stylesheet();
	$locale          = get_locale();
	$fallback_locale = 'en';

	$annotation         = wpcomsh_headstart_get_annotation( $theme_name, $locale, $fallback_locale );
	$missing_taxonomies = array();

	if ( false === $annotation ) {
		wpcomsh_headstart_log( "wpcomsh_apply_headstart_terms: Could not find the headstart annotation for theme [$theme_name]. locale=[$locale] fallback_locale=[$fallback_locale]" );
		return $missing_taxonomies;
	}

	if ( ! empty( $annotation['custom_terms_by_taxonomy'] ) ) {
		wpcomsh_headstart_log( "wpcomsh_apply_headstart_terms: Found custom_terms_by_taxonomy for [$theme], applying." );
		$custom_terms_return = wpcomsh_apply_headstart_custom_terms( $annotation['custom_terms_by_taxonomy'] );
		$term_id_map         = $custom_terms_return['term_id_map'];
		$missing_taxonomies  = $custom_terms_return['missing_taxonomies'];
		wpcomsh_headstart_log( compact( 'term_id_map', 'missing_taxonomies' ) );
		if ( ! empty( $annotation['custom_term_meta'] ) ) {
			wpcomsh_headstart_log( "wpcomsh_apply_headstart_terms: Found custom_terms_meta for [$theme], applying." );
			wpcomsh_apply_headstart_custom_term_meta( $annotation['custom_term_meta'], $term_id_map );
		}
		if ( ! empty( $annotation['custom_term_assignments'] ) ) {
			wpcomsh_headstart_log( "wpcomsh_apply_headstart_terms: Found custom_term_assignments for [$theme], applying." );
			wpcomsh_apply_headstart_custom_term_assignments( $annotation['custom_term_assignments'] );
		}
	} else {
		wpcomsh_headstart_log( "wpcomsh_apply_headstart_terms: Found an annotation for [$theme], but not taking action since it did not contain custom_terms_by_taxonomy." );
	}
	return array( 'missing_taxonomies' => $missing_taxonomies );
}

/**
 * Logging wrapper.
 *
 * @param mixed $input Anything you want to log.
 */
function wpcomsh_headstart_log( $input ) {
	if ( is_wp_error( $input ) ) {
		$input = $input->get_error_message();
	} elseif ( ! is_string( $input ) ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
		$input = print_r( $input, true );
	}
	// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	error_log( 'WPComSH: headstart: ' . $input );
}

/**
 * Given a list of custom term assignments for several posts from a headstart annotation,
 * try to locate posts on the live site matching the "old ids" in the assignment, then
 * apply the terms listed.
 *
 * Old vs New:
 * "old" post id: 1379   - This represents the "Red Shirt" post's ID in the annotation.
 * "new" post id: 203482 - This represents the "Red Shirt" post's ID on the current site.
 *
 * @param array $custom_term_assignments An array where keys are "old" post IDs and the values
 * are arrays. The inner arrays' keys are taxonomy names and values are arrays of term names.
 * Example:
 *  "81": {
 *    "product_cat": [ "Men", "Women" ],
 *    "product_tag": [ "New Arrivals" ],
 *  },
 *  "80": {
 *    "product_cat": [ "Men", "Women" ],
 *    "product_tag": [ "New Arrivals" ],
 *  },
 **/
function wpcomsh_apply_headstart_custom_term_assignments( $custom_term_assignments ) {
	$filter   = array(
		'fields'      => 'ids',
		'nopaging'    => true,
		'post_status' => 'publish',
		'post_type'   => get_post_types(),
	);
	$post_ids = get_posts( $filter );

	foreach ( $post_ids as $post_id ) {
		$old_id = get_post_meta( $post_id, '_hs_old_id', true );
		if ( empty( $old_id ) || empty( $custom_term_assignments[ $old_id ] ) ) {
			continue;
		}
		wpcomsh_apply_headstart_custom_term_assignment( $post_id, $custom_term_assignments[ $old_id ] );
	}
}

/**
 * Given a single post id, and a list of custom term assignments for
 * up to several taxonomies, add those terms assignments to the post.
 *
 * @param int   $post_id A single post id.
 * @param array $assignments An array where keys are taxonomy names and values are arrays of term names.
 *  Example: {
 *   "product_cat": [ "Men", "Women" ],
 *   "product_tag": [ "New Arrivals" ],
 *  }
 */
function wpcomsh_apply_headstart_custom_term_assignment( $post_id, $assignments ) {
	$append = true; // Don't ever delete terms
	foreach ( $assignments as $taxonomy => $terms ) {
		if ( empty( $terms ) ) {
			continue;
		}
		$result = wp_set_object_terms( $post_id, $terms, $taxonomy, $append );
		if ( is_wp_error( $result ) ) {
			$error_message = "Failed to set terms for post $post_id in taxonomy $taxonomy due to error: " . $result->get_error_message();
			wpcomsh_headstart_log( $error_message );
		}
	}
}

/**
 * Given a list of custom terms for several taxonomies,
 * check if each of those terms exists and if not, add it to
 * the site.
 *
 * A term is one value of a taxonomy. For example, the "category" taxonomy might
 * have the "Shirts" and "Shoes" terms.
 *
 * @param array $custom_terms_by_taxonomy An array where the keys are the taxonomy names
 *     and the values are arrays of arrays (the same as what's returned by get_terms( $taxonomy )).
 *  Example: {
 *  "product_cat": [
 *    { "term_id": 1379, "name": "Men", "slug": "men", "term_group": 0, "term_taxonomy_id": 25,
 *      "taxonomy": "product_cat", "description": "", "parent": 0, "count": 4, "filter": "raw" },
 *    { "term_id": 1380, "name": "Women", "slug": "women", "term_group": 0, "term_taxonomy_id": 26,
 *      "taxonomy": "product_cat", "description": "", "parent": 0, "count": 4, "filter": "raw" }
 *  ],
 *  "product_tag": [
 *    { "term_id": 1381, "name": "New Arrivals", "slug": "new-arrivals", "term_group": 0,
 *      "term_taxonomy_id": 27, "taxonomy": "product_tag", "description": "", "parent": 0,
 *      "count": 4, "filter": "raw" }
 *  ]
 *  }
 * @return array $term_id_map A mapping of "old" term_ids to "new" term_ids for any terms that were inserted or found.
 */
function wpcomsh_apply_headstart_custom_terms( $custom_terms_by_taxonomy ) {
	$term_id_map        = array();
	$missing_taxonomies = array();

	foreach ( $custom_terms_by_taxonomy as $taxonomy => $terms ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			wpcomsh_headstart_log( "Skipping taxonomy [$taxonomy] because it does not exist." );
			$missing_taxonomies[] = $taxonomy;
			continue;
		}

		// First pass: Move terms into $terms_by_parent
		$terms_by_parent = array();
		foreach ( $terms as $term ) {
			$parent_id = $term['parent'];
			if ( empty( $parent_id ) ) {
				$parent_id = 0;
			}

			if ( empty( $terms_by_parent[ $parent_id ] ) ) {
				$terms_by_parent[ $parent_id ] = array( $term );
			} else {
				$terms_by_parent[ $parent_id ][] = $term;
			}
		}

		// Top level terms are 'addable': put those into a queue.
		// As we insert terms, any terms that depend on those will be added to the queue.
		$addable_terms = $terms_by_parent['0'];
		while ( ! empty( $addable_terms ) ) {
			$term = array_shift( $addable_terms );

			$old_term_id = $term['term_id'];
			$new_term_id = null;

			$term_info = term_exists( $term['slug'], $taxonomy );
			if ( $term_info ) {
				// Already exists
				$new_term_id = $term_info['term_id'];
			} else {
				// Doesn't exist, will add
				$args   = array(
					'slug'        => $term['slug'],
					'description' => $term['description'],
					'parent'      => isset( $term_id_map[ $term['parent'] ] ) ? $term_id_map[ $term['parent'] ] : 0,
				);
				$result = wp_insert_term( $term['name'], $taxonomy, $args );
				if ( ! is_wp_error( $result ) ) {
					$new_term_id = $result['term_id'];
				}
			}

			if ( ! empty( $new_term_id ) ) {
				// Record the ID mapping
				$term_id_map[ $old_term_id ] = $new_term_id;

				// Mark any terms depending on me as "addable"
				if ( ! empty( $terms_by_parent[ $old_term_id ] ) ) {
					$addable_terms = array_merge( $addable_terms, $terms_by_parent[ $old_term_id ] );
					unset( $terms_by_parent[ $old_term_id ] );
				}
			}
		}
	}
	return array(
		'term_id_map'        => $term_id_map,
		'missing_taxonomies' => $missing_taxonomies,
	);
}

/**
 * Given an annotation's list of term_meta assignments, and a
 * map of "old" term ids to "new" term ids, write the term_meta values
 * in the assignment to the "new" term ids.
 *
 * Example:
 * "old" term id: 1379   - This represents the "New Arrivals" category's ID in the annotation.
 * "new" term id: 203482 - This represents the "New Arrivals" category's ID on the current site.
 *
 * @param array $custom_term_meta Term_meta assignments by "old" id.
 *  Example: { "1379": { "order": [ 0 ], "another_meta_key": [ "another_meta_value" ] }, ... }
 * @param array $term_id_map Mapping of "old" term ids to "new" term ids.
 *  Example: { "1379": "203482", "1380": "203483", ... }
 */
function wpcomsh_apply_headstart_custom_term_meta( $custom_term_meta, $term_id_map ) {
	foreach ( $custom_term_meta as $old_term_id => $metas ) {
		if ( empty( $term_id_map[ $old_term_id ] ) ) {
			continue;
		}
		$new_term_id = $term_id_map[ $old_term_id ];

		// Find which term meta keys are already set on this term.
		$existing_meta_keys = array();
		$has_term_meta      = has_term_meta( $new_term_id );
		if ( ! empty( $has_term_meta ) ) {
			$existing_meta_keys = array_map(
				function( $row ) {
					return $row['meta_key'];
				},
				$has_term_meta
			);
		}

		foreach ( $metas as $meta_key => $meta_value ) {
			if ( is_array( $meta_value ) && count( $meta_value ) === 1 ) {
				$meta_value = reset( $meta_value );
			}

			// Only write values if they do not already exist.
			if ( in_array( $meta_key, $existing_meta_keys, true ) ) {
				continue;
			}

			$result = add_term_meta( $new_term_id, $meta_key, $meta_value );
			if ( is_wp_error( $result ) ) {
				$error_message = "Failed to add term_meta for term $new_term_id (old term id: $old_term_id) and meta key $meta_key due to error: " . $result->get_error_message();
				wpcomsh_headstart_log( $error_message );
			}
		}
	}
}

add_action( 'woocommerce_installed', 'wpcomsh_apply_headstart_terms' );
