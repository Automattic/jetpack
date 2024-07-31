<?php
/**
 * Taxonomy API: Core category-specific functionality
 *
 * @package WordPress
 * @subpackage Taxonomy
 */

/**
 * Retrieves a list of category objects.
 *
 * If you set the 'taxonomy' argument to 'link_category', the link categories
 * will be returned instead.
 *
 * @since 2.1.0
 *
 * @see get_terms() Type of arguments that can be changed.
 *
 * @param string|array $args {
 *     Optional. Arguments to retrieve categories. See get_terms() for additional options.
 *
 *     @type string $taxonomy Taxonomy to retrieve terms for. Default 'category'.
 * }
 * @return array List of category objects.
 */
function get_categories( $args = '' ) {
	$defaults = array( 'taxonomy' => 'category' );
	$args     = wp_parse_args( $args, $defaults );

	/**
	 * Filters the taxonomy used to retrieve terms when calling get_categories().
	 *
	 * @since 2.7.0
	 *
	 * @param string $taxonomy Taxonomy to retrieve terms from.
	 * @param array  $args     An array of arguments. See get_terms().
	 */
	$args['taxonomy'] = apply_filters( 'get_categories_taxonomy', $args['taxonomy'], $args );

	// Back compat.
	if ( isset( $args['type'] ) && 'link' === $args['type'] ) {
		_deprecated_argument(
			__FUNCTION__,
			'3.0.0',
			sprintf(
				/* translators: 1: "type => link", 2: "taxonomy => link_category" */
				__( '%1$s is deprecated. Use %2$s instead.' ),
				'<code>type => link</code>',
				'<code>taxonomy => link_category</code>'
			)
		);
		$args['taxonomy'] = 'link_category';
	}

	$categories = get_terms( $args );

	if ( is_wp_error( $categories ) ) {
		$categories = array();
	} else {
		$categories = (array) $categories;
		foreach ( array_keys( $categories ) as $k ) {
			_make_cat_compat( $categories[ $k ] );
		}
	}

	return $categories;
}

/**
 * Retrieves category data given a category ID or category object.
 *
 * If you pass the $category parameter an object, which is assumed to be the
 * category row object retrieved the database. It will cache the category data.
 *
 * If you pass $category an integer of the category ID, then that category will
 * be retrieved from the database, if it isn't already cached, and pass it back.
 *
 * If you look at get_term(), then both types will be passed through several
 * filters and finally sanitized based on the $filter parameter value.
 *
 * @since 1.5.1
 *
 * @param int|object $category Category ID or category row object.
 * @param string     $output   Optional. The required return type. One of OBJECT, ARRAY_A, or ARRAY_N, which
 *                             correspond to a WP_Term object, an associative array, or a numeric array,
 *                             respectively. Default OBJECT.
 * @param string     $filter   Optional. How to sanitize category fields. Default 'raw'.
 * @return object|array|WP_Error|null Category data in type defined by $output parameter.
 *                                    WP_Error if $category is empty, null if it does not exist.
 */
function get_category( $category, $output = OBJECT, $filter = 'raw' ) {
	$category = get_term( $category, 'category', $output, $filter );

	if ( is_wp_error( $category ) ) {
		return $category;
	}

	_make_cat_compat( $category );

	return $category;
}

/**
 * Retrieves a category based on URL containing the category slug.
 *
 * Breaks the $category_path parameter up to get the category slug.
 *
 * Tries to find the child path and will return it. If it doesn't find a
 * match, then it will return the first category matching slug, if $full_match,
 * is set to false. If it does not, then it will return null.
 *
 * It is also possible that it will return a WP_Error object on failure. Check
 * for it when using this function.
 *
 * @since 2.1.0
 *
 * @param string $category_path URL containing category slugs.
 * @param bool   $full_match    Optional. Whether full path should be matched.
 * @param string $output        Optional. The required return type. One of OBJECT, ARRAY_A, or ARRAY_N, which
 *                              correspond to a WP_Term object, an associative array, or a numeric array,
 *                              respectively. Default OBJECT.
 * @return WP_Term|array|WP_Error|null Type is based on $output value.
 */
function get_category_by_path( $category_path, $full_match = true, $output = OBJECT ) {
	$category_path  = rawurlencode( urldecode( $category_path ) );
	$category_path  = str_replace( '%2F', '/', $category_path );
	$category_path  = str_replace( '%20', ' ', $category_path );
	$category_paths = '/' . trim( $category_path, '/' );
	$leaf_path      = sanitize_title( basename( $category_paths ) );
	$category_paths = explode( '/', $category_paths );
	$full_path      = '';

	foreach ( (array) $category_paths as $pathdir ) {
		$full_path .= ( '' !== $pathdir ? '/' : '' ) . sanitize_title( $pathdir );
	}

	$categories = get_terms(
		array(
			'taxonomy' => 'category',
			'get'      => 'all',
			'slug'     => $leaf_path,
		)
	);

	if ( empty( $categories ) ) {
		return;
	}

	foreach ( $categories as $category ) {
		$path        = '/' . $leaf_path;
		$curcategory = $category;

		while ( ( 0 !== $curcategory->parent ) && ( $curcategory->parent !== $curcategory->term_id ) ) {
			$curcategory = get_term( $curcategory->parent, 'category' );

			if ( is_wp_error( $curcategory ) ) {
				return $curcategory;
			}

			$path = '/' . $curcategory->slug . $path;
		}

		if ( $path === $full_path ) {
			$category = get_term( $category->term_id, 'category', $output );
			_make_cat_compat( $category );

			return $category;
		}
	}

	// If full matching is not required, return the first cat that matches the leaf.
	if ( ! $full_match ) {
		$category = get_term( reset( $categories )->term_id, 'category', $output );
		_make_cat_compat( $category );

		return $category;
	}
}

/**
 * Retrieves a category object by category slug.
 *
 * @since 2.3.0
 *
 * @param string $slug The category slug.
 * @return object|false Category data object on success, false if not found.
 */
function get_category_by_slug( $slug ) {
	$category = get_term_by( 'slug', $slug, 'category' );

	if ( $category ) {
		_make_cat_compat( $category );
	}

	return $category;
}

/**
 * Retrieves the ID of a category from its name.
 *
 * @since 1.0.0
 *
 * @param string $cat_name Category name.
 * @return int Category ID on success, 0 if the category doesn't exist.
 */
function get_cat_ID( $cat_name ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid
	$cat = get_term_by( 'name', $cat_name, 'category' );

	if ( $cat ) {
		return $cat->term_id;
	}

	return 0;
}

/**
 * Retrieves the name of a category from its ID.
 *
 * @since 1.0.0
 *
 * @param int $cat_id Category ID.
 * @return string Category name, or an empty string if the category doesn't exist.
 */
function get_cat_name( $cat_id ) {
	$cat_id   = (int) $cat_id;
	$category = get_term( $cat_id, 'category' );

	if ( ! $category || is_wp_error( $category ) ) {
		return '';
	}

	return $category->name;
}

/**
 * Checks if a category is an ancestor of another category.
 *
 * You can use either an ID or the category object for both parameters.
 * If you use an integer, the category will be retrieved.
 *
 * @since 2.1.0
 *
 * @param int|object $cat1 ID or object to check if this is the parent category.
 * @param int|object $cat2 The child category.
 * @return bool Whether $cat2 is child of $cat1.
 */
function cat_is_ancestor_of( $cat1, $cat2 ) {
	return term_is_ancestor_of( $cat1, $cat2, 'category' );
}

/**
 * Sanitizes category data based on context.
 *
 * @since 2.3.0
 *
 * @param object|array $category Category data.
 * @param string       $context  Optional. Default 'display'.
 * @return object|array Same type as $category with sanitized data for safe use.
 */
function sanitize_category( $category, $context = 'display' ) {
	return sanitize_term( $category, 'category', $context );
}

/**
 * Sanitizes data in single category key field.
 *
 * @since 2.3.0
 *
 * @param string $field   Category key to sanitize.
 * @param mixed  $value   Category value to sanitize.
 * @param int    $cat_id  Category ID.
 * @param string $context What filter to use, 'raw', 'display', etc.
 * @return mixed Value after $value has been sanitized.
 */
function sanitize_category_field( $field, $value, $cat_id, $context ) {
	return sanitize_term_field( $field, $value, $cat_id, 'category', $context );
}

/* Tags */

/**
 * Retrieves all post tags.
 *
 * @since 2.3.0
 *
 * @param string|array $args {
 *     Optional. Arguments to retrieve tags. See get_terms() for additional options.
 *
 *     @type string $taxonomy Taxonomy to retrieve terms for. Default 'post_tag'.
 * }
 * @return WP_Term[]|int|WP_Error Array of 'post_tag' term objects, a count thereof,
 *                                or WP_Error if any of the taxonomies do not exist.
 */
function get_tags( $args = '' ) {
	$defaults = array( 'taxonomy' => 'post_tag' );
	$args     = wp_parse_args( $args, $defaults );

	$tags = get_terms( $args );

	if ( empty( $tags ) ) {
		$tags = array();
	} else {
		/**
		 * Filters the array of term objects returned for the 'post_tag' taxonomy.
		 *
		 * @since 2.3.0
		 *
		 * @param WP_Term[]|int|WP_Error $tags Array of 'post_tag' term objects, a count thereof,
		 *                                     or WP_Error if any of the taxonomies do not exist.
		 * @param array                  $args An array of arguments. See {@see get_terms()}.
		 */
		$tags = apply_filters( 'get_tags', $tags, $args );
	}

	return $tags;
}

/**
 * Retrieves a post tag by tag ID or tag object.
 *
 * If you pass the $tag parameter an object, which is assumed to be the tag row
 * object retrieved from the database, it will cache the tag data.
 *
 * If you pass $tag an integer of the tag ID, then that tag will be retrieved
 * from the database, if it isn't already cached, and passed back.
 *
 * If you look at get_term(), both types will be passed through several filters
 * and finally sanitized based on the $filter parameter value.
 *
 * @since 2.3.0
 *
 * @param int|WP_Term|object $tag    A tag ID or object.
 * @param string             $output Optional. The required return type. One of OBJECT, ARRAY_A, or ARRAY_N, which
 *                                   correspond to a WP_Term object, an associative array, or a numeric array,
 *                                   respectively. Default OBJECT.
 * @param string             $filter Optional. How to sanitize tag fields. Default 'raw'.
 * @return WP_Term|array|WP_Error|null Tag data in type defined by $output parameter.
 *                                     WP_Error if $tag is empty, null if it does not exist.
 */
function get_tag( $tag, $output = OBJECT, $filter = 'raw' ) {
	return get_term( $tag, 'post_tag', $output, $filter );
}

/* Cache */

/**
 * Removes the category cache data based on ID.
 *
 * @since 2.1.0
 *
 * @param int $id Category ID
 */
function clean_category_cache( $id ) {
	clean_term_cache( $id, 'category' );
}

/**
 * Updates category structure to old pre-2.3 from new taxonomy structure.
 *
 * This function was added for the taxonomy support to update the new category
 * structure with the old category one. This will maintain compatibility with
 * plugins and themes which depend on the old key or property names.
 *
 * The parameter should only be passed a variable and not create the array or
 * object inline to the parameter. The reason for this is that parameter is
 * passed by reference and PHP will fail unless it has the variable.
 *
 * There is no return value, because everything is updated on the variable you
 * pass to it. This is one of the features with using pass by reference in PHP.
 *
 * @since 2.3.0
 * @since 4.4.0 The `$category` parameter now also accepts a WP_Term object.
 * @access private
 *
 * @param array|object|WP_Term $category Category row object or array.
 */
function _make_cat_compat( &$category ) {
	if ( is_object( $category ) && ! is_wp_error( $category ) ) {
		$category->cat_ID               = $category->term_id;
		$category->category_count       = $category->count;
		$category->category_description = $category->description;
		$category->cat_name             = $category->name;
		$category->category_nicename    = $category->slug;
		$category->category_parent      = $category->parent;
	} elseif ( is_array( $category ) && isset( $category['term_id'] ) ) {
		$category['cat_ID']               = &$category['term_id'];
		$category['category_count']       = &$category['count'];
		$category['category_description'] = &$category['description'];
		$category['cat_name']             = &$category['name'];
		$category['category_nicename']    = &$category['slug'];
		$category['category_parent']      = &$category['parent'];
	}
}
