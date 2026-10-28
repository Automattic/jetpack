<?php
/**
 * Lists WordPress.com themes as a tab on the core Add Themes screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

// @codeCoverageIgnoreStart -- shadowed by the test stub in tests/lib/functions-wordpress.php.
if ( ! function_exists( 'wpcom_themes_get_purchases' ) ) {
	/**
	 * Source of purchase data for the themes tab, pre-definable by a test as
	 * wpcom_expiry_get_purchases() is, and for the reason given there.
	 *
	 * @return array
	 *
	 * @phan-suppress PhanRedefineFunction -- phan sees both this and the test stub as definitions even though only one loads at runtime.
	 */
	function wpcom_themes_get_purchases() {
		if ( function_exists( 'wpcom_get_site_purchases' ) ) {
			return wpcom_get_site_purchases();
		}

		return array();
	}
}
// @codeCoverageIgnoreEnd

/**
 * The tab's `data-sort` value, which core's theme.js sends to themes_api() as `browse`.
 */
const WPCOM_THEMES_TAB = 'wpcom';

/**
 * Feature flag gating the tab.
 */
const WPCOM_THEMES_TAB_FLAG = 'wpcom-themes-marketplace-tab';

/**
 * Themes per request, which is also the grid's page size.
 */
const WPCOM_THEMES_TAB_PER_PAGE = 100;

/**
 * The `wpcom_pricing` value that lists only the themes this site can install with nothing to buy.
 */
const WPCOM_THEMES_TAB_INCLUDED = 'included';

/**
 * Registers the feature flag.
 *
 * @return void
 */
function wpcom_themes_tab_register_flag() {
	Feature_Flags::register(
		WPCOM_THEMES_TAB_FLAG,
		array(
			'default'     => false,
			'description' => 'Show WordPress.com themes as a tab on the Add Themes screen.',
			'owner'       => 'jetpack-mu-wpcom',
		)
	);
}
wpcom_themes_tab_register_flag();

/**
 * Whether to show the tab on this site.
 *
 * Atomic only for now: Simple has no Add Themes screen to add a tab to, and this package ships
 * there too, so the host is checked rather than left to the screen's absence.
 *
 * @return bool
 */
function wpcom_themes_tab_enabled() {
	return is_woa_site() && Feature_Flags::is_enabled( WPCOM_THEMES_TAB_FLAG );
}

/**
 * Loads the script that adds the tab.
 *
 * Core hard-codes this screen's tabs with no filter (trac #65979), so the script inserts ours
 * into the markup before core's theme.js reads it on DOM ready.
 *
 * @return void
 */
function wpcom_themes_tab_enqueue_script() {
	if ( ! wpcom_themes_tab_enabled() ) {
		return;
	}

	// Core's theme.js owns the views this decorates, and routes on DOM ready rather than on load.
	wp_enqueue_script(
		'wpcom-themes-tab',
		plugins_url( 'js/themes-tab.js', __FILE__ ),
		array( 'theme' ),
		// The package version does not change between builds of it, and these are served for a year.
		(string) filemtime( __DIR__ . '/js/themes-tab.js' ),
		array( 'in_footer' => true )
	);
	wp_localize_script(
		'wpcom-themes-tab',
		'wpcomThemesTab',
		array(
			'sort'           => WPCOM_THEMES_TAB,
			'label'          => _x( 'Marketplace', 'Theme Installer', 'jetpack-mu-wpcom' ),
			'upgrade'        => __( 'Upgrade', 'jetpack-mu-wpcom' ),
			/* translators: %s: Theme name. */
			'upgradeLabel'   => __( 'Upgrade for %s', 'jetpack-mu-wpcom' ),
			'subscribe'      => __( 'Subscribe', 'jetpack-mu-wpcom' ),
			/* translators: %s: Theme name. */
			'subscribeLabel' => __( 'Subscribe to %s', 'jetpack-mu-wpcom' ),
			'pricingLabel'   => __( 'Filter themes by plan', 'jetpack-mu-wpcom' ),
			'allPlans'       => __( 'All plans', 'jetpack-mu-wpcom' ),
			'included'       => WPCOM_THEMES_TAB_INCLUDED,
			'includedLabel'  => __( 'Included with my plan', 'jetpack-mu-wpcom' ),
			'products'       => WPCom_Themes_Store::PRODUCTS_URL,
			/* translators: %s: Price per month, for example $7.20. */
			'price'          => __( '%s/mo, billed annually', 'jetpack-mu-wpcom' ),
			/* translators: 1: Price per month, for example $7.20. 2: Plan name, for example Personal plan. */
			'priceWithPlan'  => __( '%1$s/mo, billed annually + %2$s', 'jetpack-mu-wpcom' ),
		)
	);
	wp_enqueue_style(
		'wpcom-themes-tab',
		plugins_url( 'css/themes-tab.css', __FILE__ ),
		array(),
		(string) filemtime( __DIR__ . '/css/themes-tab.css' )
	);

	Common\wpcom_enqueue_tracking_scripts( jetpack_mu_wpcom_enqueue_assets( 'wpcom-themes-tab-tracks', array( 'js' ) ) );
}
add_action( 'load-theme-install.php', 'wpcom_themes_tab_enqueue_script' );

/**
 * Whether a request to the Add Themes screen should land on this tab.
 *
 * @param array $query The request's query args.
 * @return bool
 */
function wpcom_themes_tab_is_default_view( array $query ) {
	if ( ! wpcom_themes_tab_enabled() ) {
		return false;
	}

	// An explicit view, a search, an upload or a preview is left as asked for.
	return ! array_intersect( array( 'browse', 'theme', 'search', 'upload' ), array_keys( $query ) );
}

/**
 * Sends a bare Add Themes request to this tab.
 *
 * Core's theme.js routes a bare `theme-install.php` to `popular` and rewrites the URL to match, so
 * the view has to be chosen before that runs rather than by ordering the tabs.
 *
 * @return void
 */
function wpcom_themes_tab_redirect_to_default_view() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reads which view was asked for, nothing more.
	if ( ! wpcom_themes_tab_is_default_view( $_GET ) ) {
		return;
	}

	wp_safe_redirect( wpcom_themes_tab_url() );
	exit;
}
add_action( 'load-theme-install.php', 'wpcom_themes_tab_redirect_to_default_view' );
/**
 * This tab's own URL.
 *
 * @return string
 */
function wpcom_themes_tab_url() {
	return admin_url( 'theme-install.php?browse=' . WPCOM_THEMES_TAB );
}

/**
 * Where to buy the plan a theme needs.
 *
 * Checkout returns to the theme itself, where the plan now allows an install, and back out to
 * the tab if it is abandoned instead.
 *
 * @param string|array $products One product slug, or the several checkout should charge for at once.
 * @param string       $slug     Theme slug.
 * @return string
 */
function wpcom_themes_tab_checkout_url( $products, string $slug ) {
	$url = sprintf(
		'https://wordpress.com/checkout/%s/%s',
		rawurlencode( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ),
		// Checkout splits this segment on commas, so each slug is encoded but the separator is not.
		implode( ',', array_map( 'rawurlencode', (array) $products ) )
	);

	// Checkout honours these on the site's own host, and add_query_arg() does not encode values.
	return add_query_arg(
		array(
			'checkoutBackUrl' => rawurlencode( wpcom_themes_tab_url() ),
			'redirect_to'     => rawurlencode( admin_url( 'theme-install.php?theme=' . rawurlencode( $slug ) ) ),
		),
		$url
	);
}

/**
 * Says what a theme costs this site, for the badge every card carries.
 *
 * Core's grid offers Install for whatever it is given, so a theme the plan excludes also has to
 * carry the upgrade that belongs in its place.
 *
 * @param stdClass $theme A theme in the themes API shape.
 * @return stdClass The theme, carrying its badge and, when the plan excludes it, an upgrade.
 */
function wpcom_themes_tab_add_plan( $theme ) {
	$theme->wpcom_marketplace_tab = true;

	$tier = isset( $theme->theme_tier ) ? (string) $theme->theme_tier : '';

	// A partner theme is sold rather than granted, so its badge is a price and not a plan.
	if ( WPCom_Themes_Tiers::PARTNER === $tier ) {
		return wpcom_themes_tab_add_subscription( $theme );
	}

	if ( wpcom_themes_tab_is_included( $tier, (string) ( $theme->slug ?? '' ) ) ) {
		$theme->plan_badge = __( 'Included with plan', 'jetpack-mu-wpcom' );

		return $theme;
	}

	$plan                 = WPCom_Themes_Tiers::plan_for( $tier );
	$theme->plan_badge    = WPCom_Themes_Tiers::plan_name_for( $tier );
	$theme->required_plan = $plan;
	$theme->upgrade_url   = wpcom_themes_tab_checkout_url( $plan, (string) ( $theme->slug ?? '' ) );

	return $theme;
}

/**
 * Whether this site can install a theme with nothing more to buy.
 *
 * @param string $tier Tier slug.
 * @param string $slug Theme slug.
 * @return bool
 */
function wpcom_themes_tab_is_included( string $tier, string $slug ) {
	// No plan includes a partner theme, so one counts only once its own subscription is paid for.
	if ( WPCom_Themes_Tiers::PARTNER === $tier ) {
		$subscription = wpcom_themes_tab_subscription( $slug );

		return array() !== $subscription && $subscription['owned'];
	}

	return '' === WPCom_Themes_Tiers::plan_for( $tier ) || WPCom_Themes_Tiers::site_can_use( $tier );
}

/**
 * Offers the subscription a partner theme needs, which no plan includes.
 *
 * The badge is left for the browser to write, because the store prices a request where it comes
 * from: read here it would quote the web server's currency rather than the reader's.
 *
 * @param stdClass $theme A theme in the themes API shape.
 * @return stdClass The theme, carrying what to price and where to buy it.
 */
function wpcom_themes_tab_add_subscription( $theme ) {
	$slug         = (string) ( $theme->slug ?? '' );
	$subscription = wpcom_themes_tab_subscription( $slug );

	// A theme already paid for is core's to install, and one the store does not sell is not ours
	// to sell. Both are left to core's own button, which a partner theme still defeats. DOTCOM-18722.
	if ( array() === $subscription || $subscription['owned'] ) {
		return $theme;
	}

	// Every paid plan grants the tier, so this is only ever the cheapest one.
	$plan = WPCom_Themes_Tiers::site_can_use( WPCom_Themes_Tiers::PARTNER )
		? ''
		: WPCom_Themes_Tiers::plan_for( WPCom_Themes_Tiers::PARTNER );

	$theme->price_product = $subscription['product'];
	$theme->price_plan    = '' === $plan ? '' : WPCom_Themes_Tiers::plan_name_for( WPCom_Themes_Tiers::PARTNER );
	$theme->required_plan = $plan;
	// Checkout charges for the plan and the theme together, so one purchase is enough to install.
	$theme->purchase_url = wpcom_themes_tab_checkout_url(
		'' === $plan ? $subscription['product'] : array( $plan, $subscription['product'] ),
		$slug
	);

	return $theme;
}

/**
 * How a partner theme is sold, and whether this site has already bought it.
 *
 * @param string $slug Theme slug.
 * @return array{product: string, owned: bool}|array{} Empty when the store does not sell it.
 */
function wpcom_themes_tab_subscription( string $slug ) {
	if ( '' === $slug ) {
		return array();
	}

	$store    = wpcom_themes_tab_store();
	$products = $store->products();

	foreach ( wpcom_themes_tab_api()->fetch_partner_products()[ $slug ] ?? array() as $sold_as ) {
		$product_slug = (string) ( $sold_as->product_slug ?? '' );
		$product      = $products[ $product_slug ] ?? null;

		if ( null === $product || WPCom_Themes_Store::TERM !== $product['term'] ) {
			continue;
		}

		return array(
			'product' => $product_slug,
			'owned'   => in_array( $product['billing_slug'], $store->subscriptions(), true ),
		);
	}

	return array();
}

/**
 * The shared WordPress.com themes reader, which wpcomsh also uses for core's own tabs.
 *
 * @return WPCom_Themes_Api
 */
function wpcom_themes_tab_api() {
	static $api;
	if ( ! $api ) {
		$api = new WPCom_Themes_Api( new WPCom_Themes_Cache() );
	}

	return $api;
}

/**
 * The store reader, which prices the themes no plan includes.
 *
 * @return WPCom_Themes_Store
 */
function wpcom_themes_tab_store() {
	static $store;
	if ( ! $store ) {
		$store = new WPCom_Themes_Store( new WPCom_Themes_Cache() );
	}

	return $store;
}

/**
 * The shared mapper, which shapes a WordPress.com theme the way core's grid reads it.
 *
 * @return WPCom_Themes_Mapper
 */
function wpcom_themes_tab_mapper() {
	static $mapper;
	if ( ! $mapper ) {
		$mapper = new WPCom_Themes_Mapper();
	}

	return $mapper;
}

/**
 * Every theme the tab lists, in the order WordPress.com returns them.
 *
 * The shared reader fetches and caches the whole catalog, so the tab pages through it here rather
 * than asking for a page at a time.
 *
 * @return array<stdClass>
 */
function wpcom_themes_tab_catalog() {
	return array_values(
		array_filter(
			wpcom_themes_tab_api()->fetch_all_non_delisted_themes(),
			static function ( $theme ) {
				return is_object( $theme ) && ! empty( $theme->id ) && is_string( $theme->id );
			}
		)
	);
}

/**
 * Answers the tab's query in place of the WordPress.org themes API.
 *
 * @param false|object|array $result The result object or array. Default false.
 * @param string             $action The type of information being requested.
 * @param object             $args   Theme API arguments.
 * @return false|object|array
 */
function wpcom_themes_tab_serve_themes_api( $result, $action, $args ) {
	if ( false !== $result || 'query_themes' !== $action || ! wpcom_themes_tab_enabled() ) {
		return $result;
	}

	// A `?theme=<slug>` preview link, loaded directly, looks its theme up by slug rather than by tab.
	if ( ! isset( $args->browse ) && isset( $args->theme ) && is_string( $args->theme ) ) {
		$theme = wpcom_themes_tab_api()->fetch_theme( $args->theme );

		return null === $theme ? $result : (object) array(
			'info'   => array(
				'page'    => 1,
				'pages'   => 1,
				'results' => 1,
			),
			'themes' => array( wpcom_themes_tab_add_plan( wpcom_themes_tab_mapper()->map_wpcom_to_wporg( $theme ) ) ),
		);
	}

	if ( ! isset( $args->browse ) || WPCOM_THEMES_TAB !== $args->browse ) {
		return $result;
	}

	$themes = wpcom_themes_tab_catalog();

	// Filtered before paging, so the count and the pages match what the grid shows.
	if ( isset( $args->wpcom_pricing ) && WPCOM_THEMES_TAB_INCLUDED === $args->wpcom_pricing ) {
		$themes = array_values(
			array_filter(
				$themes,
				static function ( $theme ) {
					// Read as the mapper reads it, so the filter agrees with the card's badge.
					return wpcom_themes_tab_is_included( (string) ( $theme->theme_tier->slug ?? '' ), $theme->id );
				}
			)
		);
	}

	$page   = isset( $args->page ) ? max( 1, (int) $args->page ) : 1;
	$mapper = wpcom_themes_tab_mapper();

	// Only the page core asked for is mapped: mapping reads each theme from disk to say whether it
	// is installed.
	$shown = array_slice( $themes, ( $page - 1 ) * WPCOM_THEMES_TAB_PER_PAGE, WPCOM_THEMES_TAB_PER_PAGE );

	return (object) array(
		'info'   => array(
			'page'    => $page,
			'pages'   => (int) ceil( count( $themes ) / WPCOM_THEMES_TAB_PER_PAGE ),
			'results' => count( $themes ),
		),
		'themes' => array_values( array_map( 'wpcom_themes_tab_add_plan', array_map( array( $mapper, 'map_wpcom_to_wporg' ), $shown ) ) ),
	);
}
add_filter( 'themes_api', 'wpcom_themes_tab_serve_themes_api', 10, 3 );

/**
 * How many partner themes a search can bring to the top, as on the plugins Marketplace tab.
 */
const WPCOM_THEMES_TAB_SEARCH_PARTNERS = 2;

/**
 * Partner themes that match a search term, best matches first.
 *
 * A match in the name ranks above one WordPress.com found elsewhere in the theme. Only themes the
 * store sells are offered.
 *
 * @param string $term What was searched for.
 * @return array<stdClass> Themes in the WordPress.com shape.
 */
function wpcom_themes_tab_search_partners( string $term ) {
	$needle = mb_strtolower( trim( $term ) );

	// Anything shorter matches half the catalog.
	if ( mb_strlen( $needle ) < 3 ) {
		return array();
	}

	$in_name   = array();
	$elsewhere = array();
	foreach ( wpcom_themes_tab_api()->search_themes( $term ) as $theme ) {
		$slug = $theme->id ?? null;

		if (
			! is_string( $slug )
			|| WPCom_Themes_Tiers::PARTNER !== ( $theme->theme_tier->slug ?? '' )
			|| array() === wpcom_themes_tab_subscription( $slug )
		) {
			continue;
		}

		if ( false !== mb_strpos( mb_strtolower( (string) ( $theme->name ?? '' ) ), $needle ) ) {
			$in_name[] = $theme;
		} else {
			$elsewhere[] = $theme;
		}
	}

	return array_slice( array_merge( $in_name, $elsewhere ), 0, WPCOM_THEMES_TAB_SEARCH_PARTNERS );
}

/**
 * Adds matching partner themes to the top of a keyword search's first page.
 *
 * Runs after wpcomsh merges in the WordPress.com themes a plan includes, which leaves partner
 * themes out because they are sold rather than included.
 *
 * @param object|WP_Error $result Themes API response.
 * @param string          $action Themes API action.
 * @param object          $args   Themes API arguments.
 * @return object|WP_Error
 */
function wpcom_themes_tab_splice_search_partners( $result, $action, $args ) {
	$term = is_object( $args ) && isset( $args->search ) && is_string( $args->search ) ? $args->search : '';
	$page = is_object( $args ) && isset( $args->page ) ? (int) $args->page : 1;

	if (
		'query_themes' !== $action
		|| '' === $term
		|| $page > 1
		|| ! is_object( $result )
		|| ! isset( $result->themes )
		|| ! is_array( $result->themes )
		|| ! wpcom_themes_tab_enabled()
	) {
		return $result;
	}

	$back     = admin_url( 'theme-install.php?search=' . rawurlencode( $term ) );
	$partners = array();
	foreach ( wpcom_themes_tab_search_partners( $term ) as $theme ) {
		$theme = wpcom_themes_tab_add_plan( wpcom_themes_tab_mapper()->map_wpcom_to_wporg( $theme ) );

		// Listed by the search, which installs and purchase clicks are attributed to.
		$theme->wpcom_marketplace_tab = false;
		$theme->wpcom_search_slot     = true;

		if ( isset( $theme->purchase_url ) ) {
			$theme->purchase_url = add_query_arg( 'checkoutBackUrl', rawurlencode( $back ), $theme->purchase_url );
		}

		$partners[] = $theme;
	}

	if ( array() === $partners ) {
		return $result;
	}

	// A WordPress.org theme with a partner theme's slug is another author's theme, so both stay listed.
	$result->themes = array_merge( $partners, $result->themes );

	if ( isset( $result->info['results'] ) ) {
		$result->info['results'] += count( $partners );
	}

	return $result;
}
add_filter( 'themes_api_result', 'wpcom_themes_tab_splice_search_partners', 10, 3 );
