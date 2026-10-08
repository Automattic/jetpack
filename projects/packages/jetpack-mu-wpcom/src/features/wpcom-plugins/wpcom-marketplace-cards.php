<?php
/**
 * Makes Marketplace plugins in core's plugin list table into Marketplace cards.
 *
 * The same cards on the Marketplace tab and at the top of matching search results. Follows
 * Jetpack's plugin search hint (`modules/plugin-search.php`), which splices a card into the
 * same results and swaps the same parts of it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

/**
 * How many of our plugins a search can bring to the top.
 */
const WPCOM_MARKETPLACE_SEARCH_LIMIT = 2;

/**
 * Transient prefix for a dependency's name, as WordPress.org gives it.
 */
const WPCOM_MARKETPLACE_DEPENDENCY_PREFIX = 'wpcom_marketplace_dependency_';

/**
 * Hooks the cards in on the first page of the Add Plugins screen.
 *
 * Core's live search runs through admin-ajax.php but sets this same screen first, so one
 * check covers the page and the Ajax results.
 *
 * @param WP_Screen $screen The current screen.
 * @return void
 */
function wpcom_marketplace_cards_start( $screen ) {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reads which page of results this is.
	$page = isset( $_GET['paged'] ) ? (int) $_GET['paged'] : 1;

	if ( ! isset( $screen->base ) || 'plugin-install' !== $screen->base || $page > 1 || ! wpcom_marketplace_tab_enabled() ) {
		return;
	}

	add_filter( 'plugins_api_result', 'wpcom_marketplace_splice_search_results', 10, 3 );
	add_filter( 'plugin_install_action_links', 'wpcom_marketplace_card_action_links', 10, 2 );
	add_filter( 'plugin_install_description', 'wpcom_marketplace_card_description_markup', 10, 2 );
	add_filter( 'plugins_api', 'wpcom_marketplace_cached_dependency', 11, 3 );
	add_filter( 'plugins_api_result', 'wpcom_marketplace_remember_dependency', 10, 3 );
	add_action( 'admin_enqueue_scripts', 'wpcom_marketplace_card_assets' );
}
add_action( 'current_screen', 'wpcom_marketplace_cards_start' );

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
function wpcom_marketplace_card_action_links( $links, $plugin ) {
	if ( empty( $plugin['wpcom_marketplace'] ) || ! is_array( $links ) ) {
		return $links;
	}

	$links[0] = wpcom_marketplace_card_button( $plugin, wpcom_marketplace_back_url() );

	return array_values( array_filter( $links ) );
}

/**
 * Where checkout's Back link should return to: the search being shown, or the tab.
 *
 * Core reads the term from the request for both the page and its Ajax live search.
 *
 * @return string Search results URL, or the Marketplace tab when there is no term.
 */
function wpcom_marketplace_back_url() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Core's handler verifies the Ajax search; this only echoes the term back.
	$term = isset( $_REQUEST['s'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['s'] ) ) : '';
	if ( '' === $term ) {
		return wpcom_marketplace_tab_url();
	}

	// add_query_arg() does not encode values.
	return add_query_arg(
		array(
			's'    => rawurlencode( $term ),
			'tab'  => 'search',
			'type' => 'term',
		),
		self_admin_url( 'plugin-install.php' )
	);
}

/**
 * Labels our cards, and carries the bottom strip and data attributes they should have.
 *
 * Core has no filter for the strip and fills it with WordPress.org ratings and install
 * counts, which these plugins do not have. Ours rides in a template, which is valid inside
 * core's <p>, and js/marketplace-cards.js moves it into place.
 *
 * @param string $description Card description.
 * @param array  $plugin      Plugin data.
 * @return string
 */
function wpcom_marketplace_card_description_markup( $description, $plugin ) {
	if ( empty( $plugin['wpcom_marketplace'] ) ) {
		return $description;
	}

	$installed = wpcom_marketplace_is_installed( $plugin );
	$referral  = Marketplace_Catalog::is_referral( $plugin );

	// Checkout installs everything a product needs, so its card says so rather than core's "required".
	$requires_label = '';
	if ( ! $installed && ! $referral && ! empty( $plugin['requires_plugins'] ) ) {
		$requires_label = sprintf( ' data-requires-label="%s"', esc_attr__( 'Additional plugins will be installed', 'jetpack-mu-wpcom' ) );
	}

	// The data attributes are what the tab's Tracks and kept details modals read off a card.
	return sprintf(
		'<span class="wpcom-marketplace-label">%s</span>%s<template class="wpcom-marketplace-strip" data-plugin="%s" data-saas="%s" data-installed="%s"%s>%s</template>',
		esc_html__( 'WordPress.com Marketplace', 'jetpack-mu-wpcom' ),
		esc_html( wpcom_marketplace_card_description( $plugin ) ),
		esc_attr( (string) ( $plugin['wpcom_product_slug'] ?? $plugin['slug'] ?? '' ) ),
		$referral ? 'true' : 'false',
		$installed ? 'true' : 'false',
		$requires_label,
		wpcom_marketplace_card_strip( $plugin ) // Built from escaped parts.
	);
}

/**
 * The dependency a plugin API call is naming for core's dependency notice, if any.
 *
 * Core's notice asks with the slug alone, once per dependency per card. The details modal
 * asks the same way, so it is told apart by its hook and keeps WordPress.org's full answer.
 * WP_Plugin_Dependencies asks with `fields` set, and keeps its own cache.
 *
 * @param string $action Plugin API action.
 * @param object $args   Plugin API arguments.
 * @return string The dependency's slug, or an empty string when the call is anything else.
 */
function wpcom_marketplace_dependency_lookup( $action, $args ) {
	if ( 'plugin_information' !== $action || ! is_object( $args ) || empty( $args->slug ) || isset( $args->fields ) ) {
		return '';
	}

	if ( doing_action( 'install_plugins_pre_plugin-information' ) ) {
		return '';
	}

	$slug = (string) $args->slug;

	return in_array( $slug, Marketplace_Catalog::get_dependency_slugs(), true ) ? $slug : '';
}

/**
 * Answers core's dependency notice from what WordPress.org said last time.
 *
 * Without this, a site without WooCommerce asks WordPress.org about it once for every
 * WooCommerce extension card, while the tab renders.
 *
 * @param false|object|WP_Error $result Result so far.
 * @param string                $action Plugin API action.
 * @param object                $args   Plugin API arguments.
 * @return false|object|WP_Error
 */
function wpcom_marketplace_cached_dependency( $result, $action, $args ) {
	if ( false !== $result ) {
		return $result;
	}

	$slug = wpcom_marketplace_dependency_lookup( $action, $args );
	if ( '' === $slug ) {
		return $result;
	}

	$cached = get_transient( WPCOM_MARKETPLACE_DEPENDENCY_PREFIX . $slug );
	if ( is_array( $cached ) ) {
		return (object) $cached;
	}

	// A lookup that just failed is not retried for every card. Core then shows the bare slug.
	if ( 'unavailable' === $cached ) {
		return new WP_Error( 'wpcom_marketplace_dependency_unavailable', $slug );
	}

	return $result;
}

/**
 * Keeps WordPress.org's name for a dependency, for wpcom_marketplace_cached_dependency().
 *
 * @param object|WP_Error $result Plugin API response.
 * @param string          $action Plugin API action.
 * @param object          $args   Plugin API arguments.
 * @return object|WP_Error
 */
function wpcom_marketplace_remember_dependency( $result, $action, $args ) {
	$slug = wpcom_marketplace_dependency_lookup( $action, $args );
	if ( '' === $slug || false !== get_transient( WPCOM_MARKETPLACE_DEPENDENCY_PREFIX . $slug ) ) {
		return $result;
	}

	if ( is_object( $result ) && ! is_wp_error( $result ) && ! empty( $result->name ) ) {
		$entry = array(
			'name'    => (string) $result->name,
			'slug'    => $slug,
			'version' => (string) ( $result->version ?? '' ),
		);

		set_transient( WPCOM_MARKETPLACE_DEPENDENCY_PREFIX . $slug, $entry, DAY_IN_SECONDS );
	} elseif ( is_wp_error( $result ) ) {
		set_transient( WPCOM_MARKETPLACE_DEPENDENCY_PREFIX . $slug, 'unavailable', Marketplace_Catalog::MISS_CACHE_TTL );
	}

	return $result;
}

/**
 * A card's bottom strip, in core's own columns so it lines up with the cards around it.
 *
 * The price takes the left column, where core shows ratings and installs, as the tab's flex
 * rows so its mixed sizes keep core's row heights. The right keeps core's last updated date
 * and compatibility, which WordPress.com manages for these plugins.
 *
 * @param array $plugin Plugin data.
 * @return string Strip markup, built from escaped parts.
 */
function wpcom_marketplace_card_strip( array $plugin ) {
	// Calypso drops the price once a plugin is installed.
	$rows = ! wpcom_marketplace_is_installed( $plugin )
		? wpcom_marketplace_price_rows( $plugin )
		: array(
			'headline' => '',
			'note'     => '',
		);

	$updated = strtotime( (string) ( $plugin['last_updated'] ?? '' ) );
	$updated = $updated
		? sprintf(
			'<strong>%s</strong> %s',
			esc_html__( 'Last Updated:', 'jetpack-mu-wpcom' ),
			/* translators: %s: Time since the plugin was updated, for example 2 days. */
			esc_html( sprintf( __( '%s ago', 'jetpack-mu-wpcom' ), human_time_diff( $updated ) ) )
		)
		: esc_html__( 'Managed by WordPress.com', 'jetpack-mu-wpcom' );

	return sprintf(
		'<div class="column-rating wpcom-marketplace-card__headline">%s</div><div class="column-updated">%s</div><div class="column-downloaded wpcom-marketplace-card__alternative">%s</div><div class="column-compatibility"><span class="compatibility-compatible">%s</span></div>',
		$rows['headline'],
		$updated,
		$rows['note'],
		wp_kses( __( '<strong>Compatible</strong> with your version of WordPress', 'jetpack-mu-wpcom' ), array( 'strong' => array() ) )
	);
}

/**
 * Loads the card styles and the script that places each card's strip, on every Add Plugins tab.
 *
 * Search can start from any of them.
 *
 * @return void
 */
function wpcom_marketplace_card_assets() {
	wp_enqueue_style(
		'wpcom-marketplace-tab',
		plugins_url( 'css/marketplace-tab.css', __FILE__ ),
		array(),
		(string) filemtime( __DIR__ . '/css/marketplace-tab.css' )
	);

	wp_enqueue_script(
		'wpcom-marketplace-cards',
		plugins_url( 'js/marketplace-cards.js', __FILE__ ),
		array(),
		(string) filemtime( __DIR__ . '/js/marketplace-cards.js' ),
		true
	);
}
