<?php
/**
 * Lists the plugins WordPress.com sells as a tab on the core Add Plugins screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner;
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
 * Draws the marketplace as core's plugin cards.
 *
 * Printed here rather than through core's list table, whose bottom strip only takes
 * core's own fields, so the price can sit where core shows ratings and installs.
 *
 * @return void
 */
function wpcom_marketplace_render_grid() {
	$products = Marketplace_Catalog::get_products();

	// Everything goes in #plugin-filter, which core's live search empties before showing its results.
	echo '<form id="plugin-filter" method="post">';
	wpcom_marketplace_intro();

	if ( empty( $products ) ) {
		printf(
			'<div class="notice notice-warning inline"><p>%s</p></div></form>',
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
	 * Core's list table wrapper, so core's card CSS lays these out as on every other tab.
	 * updates.js also delegates its button clicks from #plugin-filter.
	 */
	printf(
		'<div class="wp-list-table widefat plugin-install"><h2 class="screen-reader-text">%s</h2><div id="the-list" class="wpcom-marketplace-grid">',
		esc_html__( 'Plugins list', 'jetpack-mu-wpcom' )
	);
	foreach ( $products as $card ) {
		wpcom_marketplace_render_card( $card );
	}
	echo '</div></div></form>';
}

/**
 * A card's description, as plain text cut to fit core's card.
 *
 * WordPress.org caps short descriptions at 150 characters, which is what core's card is sized for.
 *
 * @param array $card Normalized product data.
 * @return string
 */
function wpcom_marketplace_card_description( array $card ) {
	$description = wp_strip_all_tags( (string) ( $card['short_description'] ?? '' ) );
	if ( mb_strlen( $description ) <= 150 ) {
		return $description;
	}

	$cut   = mb_substr( $description, 0, 150 );
	$space = mb_strrpos( $cut, ' ' );

	return rtrim( false === $space ? $cut : mb_substr( $cut, 0, $space ), ' .,;:' ) . '…';
}

/**
 * One plugin card, in core's markup, with Purchase for Install Now and the price in the bottom strip.
 *
 * @param array $card Normalized product data.
 * @return void
 */
function wpcom_marketplace_render_card( array $card ) {
	$slug = (string) ( $card['slug'] ?? '' );
	if ( '' === $slug ) {
		return;
	}

	$name      = (string) ( $card['name'] ?? $slug );
	$icon      = (string) ( $card['icons']['2x'] ?? $card['icons']['1x'] ?? '' );
	$details   = wpcom_marketplace_details_url( $slug );
	$installed = 'install' !== install_plugin_install_status( $card )['status'];

	$actions = array_filter(
		array(
			wpcom_marketplace_card_button( $card ),
			sprintf(
				'<a href="%s" class="thickbox open-plugin-details-modal" data-wpcom-marketplace-track="details" aria-label="%s" data-title="%s">%s</a>',
				esc_url( $details ),
				/* translators: %s: Plugin name. */
				esc_attr( sprintf( __( 'More information about %s', 'jetpack-mu-wpcom' ), $name ) ),
				esc_attr( $name ),
				esc_html__( 'More Details', 'jetpack-mu-wpcom' )
			),
		)
	);
	?>
	<div class="plugin-card plugin-card-<?php echo esc_attr( sanitize_html_class( $slug ) ); ?> wpcom-marketplace-card" data-plugin="<?php echo esc_attr( (string) ( $card['wpcom_product_slug'] ?? $slug ) ); ?>" data-saas="<?php echo Marketplace_Catalog::is_referral( $card ) ? 'true' : 'false'; ?>" data-installed="<?php echo $installed ? 'true' : 'false'; ?>">
		<div class="plugin-card-top">
			<div class="name column-name">
				<h3>
					<a href="<?php echo esc_url( $details ); ?>" class="thickbox open-plugin-details-modal" data-wpcom-marketplace-track="details">
						<?php echo esc_html( $name ); ?>
						<?php if ( '' !== $icon ) : ?>
							<img src="<?php echo esc_url( $icon ); ?>" class="plugin-icon" alt="" />
						<?php endif; ?>
					</a>
				</h3>
			</div>
			<div class="action-links">
				<?php // Buttons are built from escaped parts, and core's own button carries data attributes. ?>
				<ul class="plugin-action-buttons"><li><?php echo implode( '</li><li>', $actions ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></li></ul>
			</div>
			<div class="desc column-description">
				<p><?php echo esc_html( wpcom_marketplace_card_description( $card ) ); ?></p>
				<?php if ( ! empty( $card['author'] ) ) : ?>
					<p class="authors"><cite>
						<?php
						/* translators: %s: Plugin author name. */
						echo esc_html( sprintf( __( 'By %s', 'jetpack-mu-wpcom' ), $card['author'] ) );
						?>
					</cite></p>
				<?php endif; ?>
			</div>
		</div>
		<div class="plugin-card-bottom">
			<?php
			// Where core puts ratings and installs. Calypso drops the price once a plugin is installed.
			if ( ! $installed ) {
				wpcom_marketplace_render_price( $card );
			}
			?>
		</div>
	</div>
	<?php
}

/**
 * The price as its two rows of markup: the headline, and the line under it.
 *
 * The headline is the yearly price, which is what the button charges, with the saving
 * beside it. The monthly price follows so the saving can be checked rather than taken on
 * trust. Both are prices a buyer can really be charged: neither is the year divided by twelve.
 *
 * @param array $card Normalized product data.
 * @return array{headline: string, note: string} Escaped markup, empty when there is nothing to show.
 */
function wpcom_marketplace_price_rows( array $card ) {
	// The vendor sets a referral's price, so it gets Calypso's list-card wording, not the store's figures.
	if ( Marketplace_Catalog::is_referral( $card ) ) {
		return array(
			'headline' => '<span class="wpcom-marketplace-card__amount">' . esc_html__( 'Start for free', 'jetpack-mu-wpcom' ) . '</span>',
			'note'     => '',
		);
	}

	$pricing = $card['wpcom_pricing'] ?? array();
	$yearly  = (string) ( $pricing[ WPCOM_MARKETPLACE_TERM ]['price'] ?? '' );
	$monthly = (string) ( $pricing['monthly']['price'] ?? '' );
	$saving  = (int) ( $card['wpcom_saving'] ?? 0 );

	if ( '' === $yearly && '' === $monthly ) {
		return array(
			'headline' => '',
			'note'     => '',
		);
	}

	// Only a product we cannot sell by the year falls back to pricing by the month.
	$has_yearly = '' !== $yearly;

	$headline = sprintf(
		'<span class="wpcom-marketplace-card__amount">%s</span> <span class="wpcom-marketplace-card__per">/%s</span>',
		esc_html( $has_yearly ? $yearly : $monthly ),
		esc_html( wpcom_marketplace_term_noun( $has_yearly ? 'yearly' : 'monthly' ) )
	);
	if ( $has_yearly && $saving >= 5 ) {
		/* translators: %d: Percentage saved, for example 31. */
		$headline .= ' <span class="wpcom-marketplace-card__saving">' . esc_html( sprintf( __( 'Save %d%%', 'jetpack-mu-wpcom' ), $saving ) ) . '</span>';
	}

	$note = '';
	if ( $has_yearly && '' !== $monthly ) {
		// Worded as a condition, not "or": the button buys the year, so this is only what it is measured against.
		/* translators: %s: Price per month, for example $9.90. */
		$note = '<span class="wpcom-marketplace-card__note">' . esc_html( sprintf( __( '%s/month if billed monthly', 'jetpack-mu-wpcom' ), $monthly ) ) . '</span>';
	}

	return array(
		'headline' => $headline,
		'note'     => $note,
	);
}

/**
 * The price block, for the Marketplace tab's bottom strip.
 *
 * @param array $card Normalized product data.
 * @return void
 */
function wpcom_marketplace_render_price( array $card ) {
	$rows = wpcom_marketplace_price_rows( $card );
	if ( '' === $rows['headline'] ) {
		return;
	}

	// Both rows are built from escaped parts.
	printf(
		'<div class="wpcom-marketplace-card__price"><p class="wpcom-marketplace-card__headline">%s</p>%s</div>',
		$rows['headline'], // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		'' === $rows['note'] ? '' : '<p class="wpcom-marketplace-card__alternative">' . $rows['note'] . '</p>' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	);
}

/**
 * The card's action, which is a purchase unless the plugin is already here.
 *
 * Installed products keep core's button: Marketplace_Products_Updater already gives
 * core the right package URL, so Activate, Update and Active all behave.
 *
 * @param array  $card     Normalized product data.
 * @param string $back_url Where checkout's Back link returns to. Defaults to the Marketplace tab.
 * @return string Button markup.
 */
function wpcom_marketplace_card_button( array $card, $back_url = '' ) {
	$name   = (string) ( $card['name'] ?? $card['slug'] ?? '' );
	$status = install_plugin_install_status( $card );

	if ( 'install' !== $status['status'] ) {
		return function_exists( 'wp_get_plugin_action_button' )
			? wp_get_plugin_action_button( $name, $card, true, true )
			: '';
	}

	/*
	 * Checkout cannot complete a referral: the subscription is the vendor's to sell.
	 * Sending someone there would take payment for the wrong thing.
	 */
	if ( Marketplace_Catalog::is_referral( $card ) ) {
		if ( '' === (string) ( $card['wpcom_referral_url'] ?? '' ) ) {
			return '';
		}

		$referral = Marketplace_Catalog::referral_url( $card, (int) Expiry_Owner::current_user_wpcom_id() );
		/* translators: %s: Plugin name. */
		$label = __( 'Get started with %s on the vendor site', 'jetpack-mu-wpcom' );

		// With no WordPress.com account to refer, Calypso's product page can sign them in first.
		if ( '' === $referral ) {
			$referral = Marketplace_Catalog::product_url( $card['wpcom_product_slug'] ?? $card['slug'] );
			/* translators: %s: Plugin name. */
			$label = __( 'Get started with %s', 'jetpack-mu-wpcom' );
		}

		// No noreferrer: Calypso's link lets the vendor see where the visit came from, and so does this one.
		return sprintf(
			'<a class="button button-compact" href="%s" target="_blank" rel="noopener" data-wpcom-marketplace-track="get_started" aria-label="%s">%s</a>',
			esc_url( $referral ),
			esc_attr( sprintf( $label, $name ) ),
			esc_html__( 'Get started', 'jetpack-mu-wpcom' )
		);
	}

	$checkout = Marketplace_Catalog::checkout_url( $card, WPCOM_MARKETPLACE_TERM, '' === $back_url ? wpcom_marketplace_tab_url() : $back_url );

	// Without a store product there is nothing to buy, so fall back to the product page.
	if ( '' === $checkout ) {
		return sprintf(
			'<a class="button button-compact" href="%s" data-wpcom-marketplace-track="get_started" aria-label="%s">%s</a>',
			esc_url( Marketplace_Catalog::product_url( $card['wpcom_product_slug'] ?? $card['slug'] ) ),
			/* translators: %s: Plugin name. */
			esc_attr( sprintf( __( 'Get started with %s', 'jetpack-mu-wpcom' ), $name ) ),
			esc_html__( 'Get started', 'jetpack-mu-wpcom' )
		);
	}

	return sprintf(
		'<a class="button button-compact" href="%s" data-wpcom-marketplace-track="purchase" aria-label="%s">%s</a>',
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
		(string) filemtime( __DIR__ . '/css/marketplace-tab.css' )
	);

	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts(
		jetpack_mu_wpcom_enqueue_assets( 'wpcom-marketplace-tab', array( 'js' ) )
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

add_action( 'install_plugins_' . WPCOM_MARKETPLACE_TAB, 'wpcom_marketplace_render_grid' );
