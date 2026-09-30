<?php
/**
 * Puts matching WordPress.com Marketplace plugins at the top of core's plugin search results.
 *
 * Follows Jetpack's plugin search hint (`modules/plugin-search.php`), which splices a card
 * into the same results and swaps the same parts of it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

/**
 * How many of our plugins a search can bring to the top.
 */
const WPCOM_MARKETPLACE_SEARCH_LIMIT = 2;

/**
 * Hooks the search in on the first page of the Add Plugins screen.
 *
 * Core's live search runs through admin-ajax.php but sets this same screen first, so one
 * check covers the page and the Ajax results.
 *
 * @param WP_Screen $screen The current screen.
 * @return void
 */
function wpcom_marketplace_search_start( $screen ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reads which page of results this is.
	$page = isset( $_GET['paged'] ) ? (int) $_GET['paged'] : 1;

	if ( ! isset( $screen->base ) || 'plugin-install' !== $screen->base || $page > 1 || ! wpcom_marketplace_tab_enabled() ) {
		return;
	}

	add_filter( 'plugins_api_result', 'wpcom_marketplace_splice_search_results', 10, 3 );
	add_filter( 'plugin_install_action_links', 'wpcom_marketplace_search_action_links', 10, 2 );
	add_filter( 'plugin_install_description', 'wpcom_marketplace_search_description', 10, 2 );
	add_action( 'admin_enqueue_scripts', 'wpcom_marketplace_search_assets' );
}
add_action( 'current_screen', 'wpcom_marketplace_search_start' );

/**
 * Our plugins that match a search term, best matches first.
 *
 * A match in the name ranks above one in the category or description. Within each, the
 * catalog's own order holds, which is by sales.
 *
 * @param string $term  What was searched for.
 * @param int    $limit How many to return at most.
 * @return array[] Normalized product data.
 */
function wpcom_marketplace_search_matches( $term, $limit ) {
	$needle = mb_strtolower( trim( wp_strip_all_tags( (string) $term ) ) );

	// Anything shorter matches half the catalog.
	if ( mb_strlen( $needle ) < 3 ) {
		return array();
	}

	$in_name   = array();
	$elsewhere = array();

	foreach ( Marketplace_Catalog::get_products() as $card ) {
		$about = ( $card['wpcom_category'] ?? '' ) . ' ' . wp_strip_all_tags( (string) ( $card['short_description'] ?? '' ) );

		if ( false !== mb_strpos( mb_strtolower( (string) ( $card['name'] ?? '' ) ), $needle ) ) {
			$in_name[] = $card;
		} elseif ( false !== mb_strpos( mb_strtolower( $about ), $needle ) ) {
			$elsewhere[] = $card;
		}
	}

	return array_slice( array_merge( $in_name, $elsewhere ), 0, $limit );
}

/**
 * Adds matching Marketplace plugins to the top of a keyword search's first page.
 *
 * @param object|WP_Error $result Plugin API response.
 * @param string          $action Plugin API action.
 * @param object          $args   Plugin API arguments.
 * @return object|WP_Error
 */
function wpcom_marketplace_splice_search_results( $result, $action, $args ) {
	if ( 'query_plugins' !== $action || ! is_object( $result ) || is_wp_error( $result ) || ! isset( $result->plugins ) ) {
		return $result;
	}

	// Tag and author searches, and the browse tabs, name no term to match.
	$term = is_object( $args ) && isset( $args->search ) ? (string) $args->search : '';
	$page = is_object( $args ) && isset( $args->page ) ? (int) $args->page : 1;
	if ( '' === $term || $page > 1 ) {
		return $result;
	}

	$matches = wpcom_marketplace_search_matches( $term, WPCOM_MARKETPLACE_SEARCH_LIMIT );
	if ( empty( $matches ) ) {
		return $result;
	}

	$ours   = array_column( $matches, 'slug' );
	$others = array_filter(
		(array) $result->plugins,
		function ( $plugin ) use ( $ours ) {
			$slug = is_array( $plugin ) ? ( $plugin['slug'] ?? '' ) : ( $plugin->slug ?? '' );
			return ! in_array( $slug, $ours, true );
		}
	);

	$result->plugins = array_merge( $matches, array_values( $others ) );

	return $result;
}

/**
 * Swaps core's Install Now on our cards for the action the Marketplace tab shows.
 *
 * Core's would install the slug from WordPress.org, which has none of these.
 *
 * @param string[] $links  Card action links, the install button first.
 * @param array    $plugin Plugin data.
 * @return string[]
 */
function wpcom_marketplace_search_action_links( $links, $plugin ) {
	if ( empty( $plugin['wpcom_marketplace'] ) || ! is_array( $links ) ) {
		return $links;
	}

	$links[0] = wpcom_marketplace_card_button( $plugin );

	return array_values( array_filter( $links ) );
}

/**
 * Labels our cards, and carries the price their bottom strip should show.
 *
 * Core has no filter for the strip and fills it with WordPress.org ratings and install
 * counts, which these plugins do not have. The price rides in a template, which is valid
 * inside core's <p>, and js/search-results.js moves it into the strip.
 *
 * @param string $description Card description.
 * @param array  $plugin      Plugin data.
 * @return string
 */
function wpcom_marketplace_search_description( $description, $plugin ) {
	if ( empty( $plugin['wpcom_marketplace'] ) ) {
		return $description;
	}

	$price = '';
	if ( 'install' === install_plugin_install_status( $plugin )['status'] ) {
		ob_start();
		wpcom_marketplace_render_price( $plugin );
		$price = ob_get_clean();
	}

	return sprintf(
		'<span class="wpcom-marketplace-label">%s</span>%s<template class="wpcom-marketplace-strip">%s</template>',
		esc_html__( 'WordPress.com Marketplace', 'jetpack-mu-wpcom' ),
		esc_html( wpcom_marketplace_card_description( $plugin ) ),
		$price
	);
}

/**
 * Loads the price styles and the script that places the price, on every Add Plugins tab.
 *
 * Search can start from any of them.
 *
 * @return void
 */
function wpcom_marketplace_search_assets() {
	wp_enqueue_style(
		'wpcom-marketplace-tab',
		plugins_url( 'css/marketplace-tab.css', __FILE__ ),
		array(),
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

	wp_enqueue_script(
		'wpcom-marketplace-search',
		plugins_url( 'js/search-results.js', __FILE__ ),
		array(),
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		true
	);
}
