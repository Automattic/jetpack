<?php
/**
 * Lists the plugins WordPress.com sells as a tab on the core Add Plugins screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Marketplace_Catalog;

/**
 * The tab's slug, which is also its `?tab=` value.
 */
const WPCOM_MARKETPLACE_TAB = 'wpcom-marketplace';

/**
 * Feature flag gating the tab.
 */
const WPCOM_MARKETPLACE_TAB_FLAG = 'wpcom-plugins-marketplace-tab';

/**
 * Registers the feature flag.
 *
 * Runs as this file loads, so the flag is listed wherever flags are read or toggled.
 *
 * @return void
 */
function wpcom_marketplace_register_flag() {
	Feature_Flags::register(
		WPCOM_MARKETPLACE_TAB_FLAG,
		array(
			'default'     => false,
			'description' => 'Show WordPress.com partner and premium plugins as a Marketplace tab on the Add Plugins screen.',
			'owner'       => 'jetpack-mu-wpcom',
		)
	);
}
wpcom_marketplace_register_flag();

/**
 * Whether to show the tab on this site.
 *
 * @return bool
 */
function wpcom_marketplace_tab_enabled() {
	return Feature_Flags::is_enabled( WPCOM_MARKETPLACE_TAB_FLAG );
}

/**
 * Adds the tab to the Add Plugins screen, ahead of Featured.
 *
 * Core lands on whichever tab comes first when none is requested, so this also
 * makes Marketplace the screen's default view. Placed before Featured rather than
 * at the very front, which leaves core's own Search Results and Beta Testing tabs
 * first on the screens that add them.
 *
 * @param string[] $tabs Tabs shown on the Add Plugins screen.
 * @return string[]
 */
function wpcom_marketplace_add_tab( $tabs ) {
	if ( ! wpcom_marketplace_tab_enabled() || ! is_array( $tabs ) ) {
		return $tabs;
	}

	$label = _x( 'Marketplace', 'Plugin Installer', 'jetpack-mu-wpcom' );

	$position = array_search( 'featured', array_keys( $tabs ), true );
	if ( false === $position ) {
		return array_merge( array( WPCOM_MARKETPLACE_TAB => $label ), $tabs );
	}

	return array_merge(
		array_slice( $tabs, 0, $position, true ),
		array( WPCOM_MARKETPLACE_TAB => $label ),
		array_slice( $tabs, $position, null, true )
	);
}
add_filter( 'install_plugins_tabs', 'wpcom_marketplace_add_tab' );

/**
 * Restores and tags the list table's API request.
 *
 * Core sets `$args` to false for a tab it does not know, which both skips the query
 * and discards the page, per_page and locale it had already put there. It reads
 * per_page back unguarded after the query, so they have to be restored here.
 *
 * @param array|false $args Plugin install API arguments.
 * @return array|false
 */
function wpcom_marketplace_tab_api_args( $args ) {
	if ( ! wpcom_marketplace_tab_enabled() ) {
		return $args;
	}

	$args = is_array( $args ) ? $args : array();

	// The catalog comes back whole, so per_page only exists to keep core's pagination happy.
	return array_merge(
		array(
			'page'     => 1,
			'per_page' => 100,
			'locale'   => get_user_locale(),
		),
		$args,
		array( 'wpcom_marketplace' => true )
	);
}
add_filter( 'install_plugins_table_api_args_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_tab_api_args' );

/**
 * Answers the plugin API with marketplace products.
 *
 * Handles the tab's listing and a details lookup for any slug in the catalog.
 *
 * @param false|object|WP_Error $result The result object or array. Default false.
 * @param string                $action The type of information being requested.
 * @param object                $args   Plugin API arguments.
 * @return false|object|WP_Error
 */
function wpcom_marketplace_serve_plugins_api( $result, $action, $args ) {
	if ( false !== $result || ! wpcom_marketplace_tab_enabled() ) {
		return $result;
	}

	if ( 'query_plugins' === $action && ! empty( $args->wpcom_marketplace ) ) {
		$products = array_values( Marketplace_Catalog::get_products() );

		return (object) array(
			'info'    => array(
				'page'    => 1,
				'pages'   => 1,
				'results' => count( $products ),
			),
			'plugins' => $products,
		);
	}

	// Scoped to the plugin screens: plugins_api( 'plugin_information' ) is called from
	// unrelated admin pages too, and none of those should pay for a catalog fetch.
	if ( 'plugin_information' === $action && ! empty( $args->slug ) && wpcom_marketplace_on_plugin_install_screen() ) {
		$product = Marketplace_Catalog::get_product_details( (string) $args->slug );

		if ( null !== $product ) {
			return (object) $product;
		}
	}

	return $result;
}
add_filter( 'plugins_api', 'wpcom_marketplace_serve_plugins_api', 10, 3 );

/**
 * Whether this request is the Add Plugins screen, the details modal included.
 *
 * @return bool
 */
function wpcom_marketplace_on_plugin_install_screen() {
	return isset( $GLOBALS['pagenow'] ) && 'plugin-install.php' === $GLOBALS['pagenow'];
}

/**
 * The billing term the screen is showing, yearly unless asked otherwise.
 *
 * @return string 'yearly' or 'monthly'.
 */
function wpcom_marketplace_billing_term() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$term = isset( $_GET['billing'] ) ? sanitize_key( wp_unslash( $_GET['billing'] ) ) : '';

	return 'monthly' === $term ? 'monthly' : 'yearly';
}

/**
 * The noun a price is read with, as in "$10.00/month".
 *
 * @param string $term 'yearly' or 'monthly'.
 * @return string
 */
function wpcom_marketplace_term_noun( $term ) {
	return 'monthly' === $term
		? __( 'month', 'jetpack-mu-wpcom' )
		: __( 'year', 'jetpack-mu-wpcom' );
}

/**
 * Lets the reader price the whole tab monthly or yearly.
 *
 * A form rather than links because core already puts one on this screen for
 * Favorites, so the markup and styling are established.
 *
 * @return void
 */
function wpcom_marketplace_billing_switcher() {
	$term = wpcom_marketplace_billing_term();
	?>
	<form method="get" class="wpcom-marketplace-billing">
		<input type="hidden" name="tab" value="<?php echo esc_attr( WPCOM_MARKETPLACE_TAB ); ?>" />
		<span class="wpcom-marketplace-billing__label"><?php esc_html_e( 'Billing', 'jetpack-mu-wpcom' ); ?></span>
		<label>
			<input type="radio" name="billing" value="yearly" <?php checked( 'yearly', $term ); ?> />
			<?php esc_html_e( 'Yearly', 'jetpack-mu-wpcom' ); ?>
		</label>
		<label>
			<input type="radio" name="billing" value="monthly" <?php checked( 'monthly', $term ); ?> />
			<?php esc_html_e( 'Monthly', 'jetpack-mu-wpcom' ); ?>
		</label>
		<input type="submit" class="button" value="<?php esc_attr_e( 'Apply', 'jetpack-mu-wpcom' ); ?>" />
	</form>
	<?php
}

/**
 * Replaces "Install Now" with a link to the product's page on WordPress.com.
 *
 * Installed products keep core's button: Marketplace_Products_Updater already gives
 * core the right package URL, so Activate, Update and Active all behave.
 *
 * @param string[] $action_links Plugin action links. Install and Details by default.
 * @param array    $plugin       Plugin data as returned by plugins_api().
 * @return string[]
 */
function wpcom_marketplace_action_links( $action_links, $plugin ) {
	if ( empty( $plugin['wpcom_marketplace'] ) || empty( $plugin['slug'] ) ) {
		return $action_links;
	}

	$status = install_plugin_install_status( $plugin );
	if ( 'install' !== $status['status'] ) {
		return $action_links;
	}

	$term         = wpcom_marketplace_billing_term();
	$checkout_url = Marketplace_Catalog::checkout_url( $plugin, $term );
	$price        = $plugin['wpcom_pricing'][ $term ]['price'] ?? '';
	$name         = $plugin['name'] ?? $plugin['slug'];

	// Without a store product there is nothing to buy, so fall back to the product page.
	if ( '' === $checkout_url ) {
		$button = sprintf(
			'<a class="button" href="%s" aria-label="%s">%s</a>',
			esc_url( Marketplace_Catalog::product_url( $plugin['wpcom_product_slug'] ?? $plugin['slug'] ) ),
			/* translators: %s: Plugin name. */
			esc_attr( sprintf( __( 'Get started with %s', 'jetpack-mu-wpcom' ), $name ) ),
			esc_html__( 'Get started', 'jetpack-mu-wpcom' )
		);
	} else {
		$label = '' === $price
			? __( 'Purchase', 'jetpack-mu-wpcom' )
			: sprintf(
				/* translators: %1$s: Price, for example $10.00. %2$s: Billing period, already translated. */
				__( 'Purchase %1$s/%2$s', 'jetpack-mu-wpcom' ),
				$price,
				wpcom_marketplace_term_noun( $term )
			);

		$button = sprintf(
			'<a class="button button-primary" href="%s" aria-label="%s">%s</a>',
			esc_url( $checkout_url ),
			/* translators: %s: Plugin name. */
			esc_attr( sprintf( __( 'Purchase and activate %s', 'jetpack-mu-wpcom' ), $name ) ),
			esc_html( $label )
		);
	}

	// Replace core's install button wherever it ended up, rather than assuming index 0.
	foreach ( $action_links as $index => $link ) {
		if ( str_contains( $link, 'install-now' ) ) {
			$action_links[ $index ] = $button;
			return $action_links;
		}
	}

	array_unshift( $action_links, $button );

	return $action_links;
}
add_filter( 'plugin_install_action_links', 'wpcom_marketplace_action_links', 10, 2 );

/**
 * Loads the tab's styles.
 *
 * @return void
 */
function wpcom_marketplace_render_tab() {
	add_filter( 'admin_body_class', 'wpcom_marketplace_body_class' );

	// The banner points at the marketplace this tab replaces. Dequeued rather than
	// unhooked because it is enqueued before core resolves which tab is being shown.
	wp_dequeue_script( 'wpcom-plugins-banner' );
	wp_dequeue_style( 'wpcom-plugins-banner-style' );

	wp_enqueue_style(
		'wpcom-marketplace-tab',
		plugins_url( 'css/marketplace-tab.css', __FILE__ ),
		array(),
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}
add_action( 'install_plugins_pre_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_render_tab' );

/**
 * Flags the screen so the stylesheet can scope itself to this tab.
 *
 * @param string $classes Space-separated admin body classes.
 * @return string
 */
function wpcom_marketplace_body_class( $classes ) {
	return $classes . ' wpcom-marketplace-tab ';
}

/**
 * Says what these plugins are, above the cards.
 *
 * @return void
 */
function wpcom_marketplace_intro() {
	printf(
		'<p class="wpcom-marketplace-intro">%s</p>',
		esc_html__( 'Premium plugins from WordPress.com and our partners. Each one comes with a subscription, and is installed, updated, and supported for you.', 'jetpack-mu-wpcom' )
	);
}

add_action( 'install_plugins_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_intro', 9 );
add_action( 'install_plugins_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_billing_switcher', 9 );
add_action( 'install_plugins_' . WPCOM_MARKETPLACE_TAB, 'display_plugins_table' );
