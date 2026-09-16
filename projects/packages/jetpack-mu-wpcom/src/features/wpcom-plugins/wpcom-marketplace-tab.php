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
 * Answers the plugin API with a marketplace product.
 *
 * Only the details modal comes through here. The tab draws its own grid straight
 * from the catalog, so it has no query to serve.
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
 * The billing term the tab sells at.
 *
 * Yearly only. Every product has both variations, but a switcher for the whole
 * screen was a lot of furniture for a choice that belongs to one purchase, and
 * checkout lets people change the term there with the product in front of them.
 */
const WPCOM_MARKETPLACE_TERM = 'yearly';

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
 * Draws the marketplace as its own grid of cards.
 *
 * Core's list table is not used here. It fixes the action column at 120px and lets
 * every card's height follow its description, which left the tab ragged and gave the
 * price nowhere to live but inside the button. Everything else core offers is kept:
 * the details modal, install status, and its buttons for products already installed.
 *
 * @return void
 */
function wpcom_marketplace_render_grid() {
	$products = Marketplace_Catalog::get_products();

	if ( empty( $products ) ) {
		printf(
			'<div class="notice notice-warning inline"><p>%s</p></div>',
			esc_html__( 'These plugins could not be loaded right now. Please try again in a few minutes.', 'jetpack-mu-wpcom' )
		);
		return;
	}

	// Core's own count markup, so it matches every other tab.
	printf(
		'<div class="tablenav top"><div class="tablenav-pages one-page"><span class="displaying-num">%s</span></div></div>',
		esc_html(
			sprintf(
				/* translators: %s: Number of plugins. */
				_n( '%s item', '%s items', count( $products ), 'jetpack-mu-wpcom' ),
				number_format_i18n( count( $products ) )
			)
		)
	);

	/*
	 * Wrapped in core's own id because that is the element updates.js delegates its
	 * plugin clicks from: `$( '#plugin-filter, #plugin-information-footer' )`.
	 * `display_plugins_table()` renders it, and dropping that call took it with it,
	 * which left an installed plugin's Update button falling back to a full-page
	 * update.php run. The cards already carry the `plugin-card-{slug}` class those
	 * handlers look a card up by.
	 */
	echo '<form id="plugin-filter" method="post"><div class="wpcom-marketplace-grid">';
	foreach ( $products as $card ) {
		wpcom_marketplace_render_card( $card );
	}
	echo '</div></form>';
}

/**
 * One plugin card.
 *
 * @param array $card Normalized product data.
 * @return void
 */
function wpcom_marketplace_render_card( array $card ) {
	$slug = (string) ( $card['slug'] ?? '' );
	if ( '' === $slug ) {
		return;
	}

	$name    = (string) ( $card['name'] ?? $slug );
	$icon    = (string) ( $card['icons']['1x'] ?? '' );
	$details = wpcom_marketplace_details_url( $slug );

	/* translators: %s: Plugin name. */
	$more_information = sprintf( __( 'More information about %s', 'jetpack-mu-wpcom' ), $name );
	?>
	<div class="wpcom-marketplace-card plugin-card-<?php echo esc_attr( sanitize_html_class( $slug ) ); ?>">
		<div class="wpcom-marketplace-card__head">
			<?php if ( '' !== $icon ) : ?>
				<img class="wpcom-marketplace-card__icon" src="<?php echo esc_url( $icon ); ?>" alt="" />
			<?php endif; ?>
			<div>
				<h3 class="wpcom-marketplace-card__name">
					<a href="<?php echo esc_url( $details ); ?>" class="thickbox open-plugin-details-modal" aria-label="<?php echo esc_attr( $more_information ); ?>"><?php echo esc_html( $name ); ?></a>
				</h3>
				<?php if ( ! empty( $card['author'] ) ) : ?>
					<p class="wpcom-marketplace-card__author">
						<?php
						/* translators: %s: Plugin author name. */
						echo esc_html( sprintf( __( 'By %s', 'jetpack-mu-wpcom' ), $card['author'] ) );
						?>
					</p>
				<?php endif; ?>
			</div>
		</div>

		<?php if ( ! empty( $card['wpcom_category'] ) ) : ?>
			<p class="wpcom-marketplace-card__category"><?php echo esc_html( $card['wpcom_category'] ); ?></p>
		<?php endif; ?>

		<p class="wpcom-marketplace-card__desc">
			<?php echo esc_html( wp_strip_all_tags( (string) ( $card['short_description'] ?? '' ) ) ); ?>
		</p>

		<p class="wpcom-marketplace-card__details">
			<?php // Named like core's own Details link, or 56 cards contribute 56 identical ones. ?>
			<a href="<?php echo esc_url( $details ); ?>" class="thickbox open-plugin-details-modal" aria-label="<?php echo esc_attr( $more_information ); ?>"><?php esc_html_e( 'Details', 'jetpack-mu-wpcom' ); ?></a>
		</p>

		<?php // Price sits with the button that charges it, rather than a row away from it. ?>
		<div class="wpcom-marketplace-card__footer">
			<?php
			wpcom_marketplace_render_price( $card );
			// Buttons are built from escaped parts, and core's own button carries data attributes.
			echo wpcom_marketplace_card_button( $card ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			?>
		</div>
	</div>
	<?php
}

/**
 * The price block.
 *
 * The headline is the yearly price, which is what the button charges, with the
 * saving beside it. The monthly price follows in small type so the saving can be
 * checked rather than taken on trust. Both are prices a buyer can really be
 * charged: neither is the year divided by twelve.
 *
 * @param array $card Normalized product data.
 * @return void
 */
function wpcom_marketplace_render_price( array $card ) {
	$pricing = $card['wpcom_pricing'] ?? array();
	$yearly  = (string) ( $pricing[ WPCOM_MARKETPLACE_TERM ]['price'] ?? '' );
	$monthly = (string) ( $pricing['monthly']['price'] ?? '' );
	$saving  = (int) ( $card['wpcom_saving'] ?? 0 );

	if ( '' === $yearly && '' === $monthly ) {
		return;
	}

	// Only a product we cannot sell by the year falls back to pricing by the month.
	$has_yearly = '' !== $yearly;
	$amount     = $has_yearly ? $yearly : $monthly;
	$per        = wpcom_marketplace_term_noun( $has_yearly ? 'yearly' : 'monthly' );
	?>
	<div class="wpcom-marketplace-card__price">
		<p class="wpcom-marketplace-card__headline">
			<span class="wpcom-marketplace-card__amount"><?php echo esc_html( $amount ); ?></span>
			<span class="wpcom-marketplace-card__per">/<?php echo esc_html( $per ); ?></span>
			<?php if ( $has_yearly && $saving >= 5 ) : ?>
				<span class="wpcom-marketplace-card__saving">
					<?php
					/* translators: %d: Percentage saved, for example 31. */
					echo esc_html( sprintf( __( 'Save %d%%', 'jetpack-mu-wpcom' ), $saving ) );
					?>
				</span>
			<?php endif; ?>
		</p>
		<?php if ( $has_yearly && '' !== $monthly ) : ?>
			<p class="wpcom-marketplace-card__alternative">
				<span class="wpcom-marketplace-card__note">
					<?php
					/*
					 * "or" read as a second option the reader could pick here, which they
					 * cannot: the button buys the year. Stated as a condition instead, so
					 * it is plainly the price this one is being measured against.
					 */
					/* translators: %s: Price per month, for example $9.90. */
					echo esc_html( sprintf( __( '%s/month if billed monthly', 'jetpack-mu-wpcom' ), $monthly ) );
					?>
				</span>
			</p>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * The card's action, which is a purchase unless the plugin is already here.
 *
 * Installed products keep core's button: Marketplace_Products_Updater already gives
 * core the right package URL, so Activate, Update and Active all behave.
 *
 * @param array $card Normalized product data.
 * @return string Button markup.
 */
function wpcom_marketplace_card_button( array $card ) {
	$name   = (string) ( $card['name'] ?? $card['slug'] ?? '' );
	$status = install_plugin_install_status( $card );

	if ( 'install' !== $status['status'] ) {
		return function_exists( 'wp_get_plugin_action_button' )
			? wp_get_plugin_action_button( $name, $card, true, true )
			: '';
	}

	$checkout = Marketplace_Catalog::checkout_url( $card, WPCOM_MARKETPLACE_TERM, wpcom_marketplace_tab_url() );

	// Without a store product there is nothing to buy, so fall back to the product page.
	if ( '' === $checkout ) {
		return sprintf(
			'<a class="button" href="%s" aria-label="%s">%s</a>',
			esc_url( Marketplace_Catalog::product_url( $card['wpcom_product_slug'] ?? $card['slug'] ) ),
			/* translators: %s: Plugin name. */
			esc_attr( sprintf( __( 'Get started with %s', 'jetpack-mu-wpcom' ), $name ) ),
			esc_html__( 'Get started', 'jetpack-mu-wpcom' )
		);
	}

	return sprintf(
		'<a class="button button-primary" href="%s" aria-label="%s">%s</a>',
		esc_url( $checkout ),
		/* translators: %s: Plugin name. */
		esc_attr( sprintf( __( 'Purchase and activate %s', 'jetpack-mu-wpcom' ), $name ) ),
		esc_html__( 'Purchase', 'jetpack-mu-wpcom' )
	);
}

/**
 * The tab's own URL, which is where checkout's Back link should return to.
 *
 * @return string
 */
function wpcom_marketplace_tab_url() {
	return add_query_arg( 'tab', WPCOM_MARKETPLACE_TAB, self_admin_url( 'plugin-install.php' ) );
}

/**
 * The thickbox URL for a product's details modal.
 *
 * @param string $slug Plugin slug.
 * @return string
 */
function wpcom_marketplace_details_url( $slug ) {
	return add_query_arg(
		array(
			'tab'       => 'plugin-information',
			'plugin'    => $slug,
			'TB_iframe' => 'true',
			'width'     => 600,
			'height'    => 550,
		),
		self_admin_url( 'plugin-install.php' )
	);
}

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
add_action( 'install_plugins_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_render_grid' );
