<?php
/**
 * Bridge between the WooCommerce Product Filters blocks and Jetpack Search.
 *
 * Hydrates the Product Filters blocks (Categories, Tags, Brands, Attributes)
 * from Jetpack Search's Elasticsearch aggregations instead of running local
 * MySQL queries. The blocks themselves are unchanged; only their data source
 * is redirected via existing extension points:
 *
 *   1. `woocommerce_pre_product_filter_data` — short-circuit count queries
 *   2. `jetpack_search_should_handle_query` — widen ES takeover to shop /
 *      product taxonomy archives
 *   3. `jetpack_search_es_wp_query_args` — translate WC URL params
 *      (`filter_<slug>`, `categories`, `tags`, `brands`, `pa_*`) into ES
 *      filter terms
 *   4. `Inline_Search::set_filters()` on `init` — register taxonomy and
 *      attribute aggregations so ES returns bucket counts (the search
 *      instance is resolved via `Inline_Search::get_instance_maybe_fallback_to_classic()`
 *      to handle both Inline and the legacy Classic fallback)
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Wires WooCommerce Product Filters blocks to Jetpack Search aggregations.
 *
 * Loaded only when WooCommerce Blocks is active and the Search module is
 * connected. Gated additionally by `jetpack_search_woocommerce_bridge_enabled`
 * (default false) while the bridge is in PoC stage.
 */
class WooCommerce_Filters_Bridge {

	/**
	 * Prefix used when registering aggregation keys with the search instance so
	 * we can reverse-map an aggregation result back to a (filter type,
	 * taxonomy) tuple.
	 */
	const AGG_KEY_PREFIX = 'wc_filter_';

	/**
	 * Singleton instance.
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Initialize the bridge if its prerequisites are satisfied.
	 *
	 * Called from the search package initializer. No-op when WooCommerce
	 * Blocks isn't loaded, the Search module isn't active, or the feature
	 * flag is off.
	 */
	public static function init() {
		if ( null !== self::$instance ) {
			return;
		}

		/**
		 * Filter whether the WooCommerce Product Filters bridge is enabled.
		 *
		 * Defaults to false while the bridge is in PoC stage. Returning true
		 * activates the bridge: WooCommerce Product Filters blocks will be
		 * hydrated from Jetpack Search's Elasticsearch aggregations on shop
		 * and product taxonomy archive pages.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Default false.
		 */
		if ( ! apply_filters( 'jetpack_search_woocommerce_bridge_enabled', false ) ) {
			return;
		}

		if ( ! self::has_required_dependencies() ) {
			return;
		}

		self::$instance = new self();
		self::$instance->register_hooks();
	}

	/**
	 * Whether the runtime environment can support the bridge.
	 */
	private static function has_required_dependencies() {
		// WooCommerce Blocks must be loaded — that's where the filter blocks
		// and the `woocommerce_pre_product_filter_data` hook live.
		if ( ! class_exists( '\Automattic\WooCommerce\Internal\ProductFilters\FilterData' ) ) {
			return false;
		}

		// Search module must be active so Inline_Search (or the Classic
		// fallback) will actually run a query and produce aggregations.
		if ( ! ( new Module_Control() )->is_active() ) {
			return false;
		}

		return true;
	}

	/**
	 * Resolve the active search singleton.
	 *
	 * Mirrors the initializer's choice between Inline_Search (the current
	 * implementation) and Classic_Search (the legacy fallback that's still
	 * used on sites without the inline-search feature flag).
	 */
	private function search_instance() {
		return Inline_Search::get_instance_maybe_fallback_to_classic();
	}

	/**
	 * Register all hooks the bridge needs.
	 */
	private function register_hooks() {
		add_action( 'init', array( $this, 'register_search_filters' ), 20 );
		add_filter( 'jetpack_search_should_handle_query', array( $this, 'handle_wc_archives' ), 10, 2 );
		add_filter( 'jetpack_search_es_wp_query_args', array( $this, 'translate_wc_url_params' ), 10, 2 );
		add_filter( 'woocommerce_pre_product_filter_data', array( $this, 'provide_filter_data' ), 10, 4 );
	}

	/**
	 * Register taxonomy + attribute aggregations with the active search
	 * instance.
	 *
	 * Each filter is keyed by `AGG_KEY_PREFIX . <type>_<taxonomy>` so the
	 * reverse map can later resolve an aggregation bucket back to its
	 * taxonomy when serving counts to the Product Filters blocks.
	 */
	public function register_search_filters() {
		$filters = array();

		$builtin_taxonomies = array( 'product_cat', 'product_tag' );
		if ( taxonomy_exists( 'product_brand' ) ) {
			$builtin_taxonomies[] = 'product_brand';
		}

		foreach ( $builtin_taxonomies as $taxonomy ) {
			$filters[ self::AGG_KEY_PREFIX . 'tax_' . $taxonomy ] = array(
				'name'     => $taxonomy,
				'type'     => 'taxonomy',
				'taxonomy' => $taxonomy,
				'count'    => 100,
			);
		}

		if ( function_exists( 'wc_get_attribute_taxonomies' ) ) {
			foreach ( wc_get_attribute_taxonomies() as $attribute_object ) {
				$taxonomy = wc_attribute_taxonomy_name( $attribute_object->attribute_name );

				$filters[ self::AGG_KEY_PREFIX . 'attr_' . $taxonomy ] = array(
					'name'      => $taxonomy,
					'type'      => 'product_attribute',
					'attribute' => $taxonomy,
					'count'     => 100,
				);
			}
		}

		$this->search_instance()->set_filters( $filters );
	}

	/**
	 * Widen Jetpack Search to take over the main query on WC archive pages.
	 *
	 * By default, JP Search only handles `is_search()` queries. Shop /
	 * product taxonomy archives are normal post-type queries, so we opt them
	 * in explicitly.
	 *
	 * @param bool      $should_handle Current decision.
	 * @param \WP_Query $query         The query under consideration.
	 * @return bool
	 */
	public function handle_wc_archives( $should_handle, $query ) {
		if ( $should_handle ) {
			return true;
		}
		if ( ! $query instanceof \WP_Query || ! $query->is_main_query() ) {
			return $should_handle;
		}

		if ( function_exists( 'is_shop' ) && is_shop() ) {
			return true;
		}

		$wc_taxonomies = array( 'product_cat', 'product_tag' );
		if ( taxonomy_exists( 'product_brand' ) ) {
			$wc_taxonomies[] = 'product_brand';
		}
		if ( $query->is_tax( $wc_taxonomies ) ) {
			return true;
		}

		return $should_handle;
	}

	/**
	 * Translate WooCommerce Product Filters URL params into ES query terms.
	 *
	 * Runs at `jetpack_search_es_wp_query_args` (priority 10), which fires
	 * before the WP→ES conversion, so we emit WP_Query-style entries.
	 *
	 * Param contract followed (matches WC's Params::get_taxonomy_params):
	 *   - `categories=foo,bar`            → product_cat slugs
	 *   - `tags=foo,bar`                  → product_tag slugs
	 *   - `brands=foo,bar`                → product_brand slugs
	 *   - `filter_<short_attr>=v1,v2`     → pa_<short_attr> slugs
	 *   - `query_type_<short_attr>=and`   → noted (see TODO below)
	 *
	 * @param array     $es_args ES-bound WP_Query args.
	 * @param \WP_Query $query   The query being translated.
	 * @return array
	 */
	public function translate_wc_url_params( $es_args, $query ) {
		unset( $query );
		$params = $this->get_request_filter_params();
		if ( empty( $params ) ) {
			return $es_args;
		}

		$builtin_map = array(
			'categories' => 'product_cat',
			'tags'       => 'product_tag',
			'brands'     => 'product_brand',
		);
		foreach ( $builtin_map as $param_key => $taxonomy ) {
			if ( ! taxonomy_exists( $taxonomy ) ) {
				continue;
			}
			$slugs = $this->collect_slug_values( $params, array( $param_key, 'filter_' . $taxonomy ) );
			if ( ! empty( $slugs ) ) {
				$es_args = $this->merge_term_slugs( $es_args, $taxonomy, $slugs );
			}
		}

		if ( function_exists( 'wc_get_attribute_taxonomies' ) ) {
			foreach ( wc_get_attribute_taxonomies() as $attribute_object ) {
				$taxonomy   = wc_attribute_taxonomy_name( $attribute_object->attribute_name );
				$short_name = $attribute_object->attribute_name;
				$slugs      = $this->collect_slug_values(
					$params,
					array( 'filter_' . $short_name, 'filter_' . $taxonomy )
				);
				if ( ! empty( $slugs ) ) {
					$es_args = $this->merge_term_slugs( $es_args, $taxonomy, $slugs );
					// TODO: query_type_<attr>=and is not faithfully translated yet — JP Search
					// treats multi-term taxonomy filters as OR within a bucket. AND semantics
					// require raw ES injection at convert_wp_es_to_es_args time.
				}
			}
		}

		return $es_args;
	}

	/**
	 * Provide filter counts to the Product Filters blocks.
	 *
	 * Returning a non-null array from `woocommerce_pre_product_filter_data`
	 * short-circuits WooCommerce's local count query.
	 *
	 * @param mixed  $pre         Current value (null = continue with default).
	 * @param string $filter_type One of price|stock|rating|attribute|taxonomy.
	 * @param array  $query_vars  WP_Query args (unused — ES already filtered).
	 * @param array  $extra       For taxonomy/attribute: `array{ taxonomy: string }`.
	 * @return mixed Array of counts when handled, otherwise `$pre`.
	 */
	public function provide_filter_data( $pre, $filter_type, $query_vars, $extra ) {
		unset( $query_vars );
		if ( null !== $pre ) {
			return $pre;
		}
		if ( ! $this->jp_search_handled_current_query() ) {
			return $pre;
		}

		switch ( $filter_type ) {
			case 'taxonomy':
				return $this->extract_taxonomy_counts( isset( $extra['taxonomy'] ) ? (string) $extra['taxonomy'] : '', 'taxonomy' );

			case 'attribute':
				return $this->extract_taxonomy_counts( isset( $extra['taxonomy'] ) ? (string) $extra['taxonomy'] : '', 'attribute' );

			// Out of PoC scope — price/stock/rating need range/term aggregations
			// that aren't first-class in Inline_Search::set_filters(). Returning
			// `null` lets WooCommerce's default behavior run for those filters
			// so the rest of the page still works.
			case 'price':
			case 'stock':
			case 'rating':
			default:
				return $pre;
		}
	}

	/**
	 * Pull taxonomy/attribute counts out of the ES aggregation response.
	 *
	 * Buckets are keyed by slug; the WC blocks expect term IDs. We resolve
	 * each slug to a term and drop buckets we can't resolve (deleted /
	 * untranslatable terms).
	 *
	 * @param string $taxonomy Taxonomy slug (e.g. `product_cat`, `pa_color`).
	 * @param string $wc_type  `taxonomy` or `attribute` (selects the registered key prefix).
	 * @return array<int,int> term_id → count
	 */
	private function extract_taxonomy_counts( $taxonomy, $wc_type ) {
		if ( '' === $taxonomy ) {
			return array();
		}

		$key_infix = ( 'attribute' === $wc_type ) ? 'attr_' : 'tax_';
		$agg_key   = self::AGG_KEY_PREFIX . $key_infix . $taxonomy;

		$aggregations = $this->search_instance()->get_search_aggregations_results();
		if ( empty( $aggregations[ $agg_key ]['buckets'] ) ) {
			return array();
		}

		$counts = array();
		foreach ( $aggregations[ $agg_key ]['buckets'] as $bucket ) {
			if ( empty( $bucket['key'] ) ) {
				continue;
			}
			$term = get_term_by( 'slug', $bucket['key'], $taxonomy );
			if ( ! $term instanceof \WP_Term ) {
				continue;
			}
			$counts[ $term->term_id ] = isset( $bucket['doc_count'] ) ? (int) $bucket['doc_count'] : 0;
		}
		return $counts;
	}

	/**
	 * Whether Jetpack Search executed (and produced aggregations for) the
	 * current query.
	 *
	 * The Product Filters blocks may render before any search has run (e.g.
	 * editor preview). In that case `get_search_aggregations_results()`
	 * returns an empty array and we should defer to WC's default behavior.
	 */
	private function jp_search_handled_current_query() {
		$aggregations = $this->search_instance()->get_search_aggregations_results();
		return ! empty( $aggregations );
	}

	/**
	 * Read filter params off the request, unslashed but not yet sanitized
	 * (sanitization happens per-value in `collect_slug_values`).
	 */
	private function get_request_filter_params() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filter URL params.
		return is_array( $_GET ) ? wp_unslash( $_GET ) : array();
	}

	/**
	 * Collect comma-separated slug values from any of the given URL params.
	 *
	 * @param array         $params     Request params (already unslashed).
	 * @param array<string> $param_keys Candidate URL keys to read from.
	 * @return array<string> Sanitized, deduplicated slug list.
	 */
	private function collect_slug_values( $params, $param_keys ) {
		$values = array();
		foreach ( $param_keys as $key ) {
			if ( empty( $params[ $key ] ) || ! is_string( $params[ $key ] ) ) {
				continue;
			}
			foreach ( explode( ',', $params[ $key ] ) as $raw ) {
				$slug = sanitize_title( trim( $raw ) );
				if ( '' !== $slug ) {
					$values[] = $slug;
				}
			}
		}
		return array_values( array_unique( $values ) );
	}

	/**
	 * Merge a slug list into `$es_args['terms'][$taxonomy]` without duplicates.
	 *
	 * @param array  $es_args  Current ES-bound WP_Query args.
	 * @param string $taxonomy Taxonomy slug.
	 * @param array  $slugs    Slug list to add.
	 * @return array
	 */
	private function merge_term_slugs( $es_args, $taxonomy, $slugs ) {
		if ( ! isset( $es_args['terms'] ) || ! is_array( $es_args['terms'] ) ) {
			$es_args['terms'] = array();
		}
		$existing                      = isset( $es_args['terms'][ $taxonomy ] ) && is_array( $es_args['terms'][ $taxonomy ] )
			? $es_args['terms'][ $taxonomy ]
			: array();
		$es_args['terms'][ $taxonomy ] = array_values( array_unique( array_merge( $existing, $slugs ) ) );
		return $es_args;
	}
}
