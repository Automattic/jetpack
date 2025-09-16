<?php
/**
 * Permalinks admin upsell pages for Atomic sites.
 *
 * Registers an upsell page in `Settings → Permalinks` and provides a small
 * template loader used to render the upsell UI.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
/**
 * Loads the upsell page template and returns its rendered HTML.
 *
 * Parameters are intentionally not used directly in this function; they are
 * made available to the included template file.
 *
 * @param string $slug                   Admin page slug.
 * @param string $title                  Upsell title.
 * @param string $description            Upsell description.
 * @param string $feature_name           Name of the feature being upsold.
 * @param string $support_link           Support doc slug.
 * @param string $checkout_redirect_to   Relative path to redirect after checkout.
 * @param string $activation_redirect_to Relative path to redirect after activation.
 *
 * @return string Rendered HTML.
 */
function wpcom_load_upsell_page_template( $slug, $title, $description, $feature_name, $support_link, $checkout_redirect_to, $activation_redirect_to ) {
	ob_start();
	include __DIR__ . '/upsell-page-template.php';
	return ob_get_clean();
}
// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

const UPSELL_PAGE_TEMPLATE_ALLOWED_HTML = array(
	'a'      => array(
		'class'       => array(),
		'href'        => array(),
		'target'      => array(),
		'data-target' => array(),
		'rel'         => array(),
	),
	'div'    => array( 'class' => array() ),
	'h1'     => array(),
	'h2'     => array(),
	'h3'     => array(),
	'li'     => array(),
	'p'      => array(),
	'strong' => array(),
	'sup'    => array(),
	'ul'     => array( 'class' => array() ),
);

/**
 * Upsell page for options-permalink.php
 */
function wpcom_upsell_page_permalink() {
	// Template variables
	$slug                   = 'options-permalink';
	$title                  = __( 'Unlock permalinks', 'jetpack-mu-wpcom' );
	$description            = __( 'Upgrade your plan to create a custom URL structure for your permalinks and archives. Clear, informative URLs improve the aesthetics, usability, and forward-compatibility of your links.', 'jetpack-mu-wpcom' );
	$support_link           = 'change-the-permalink-structure';
	$checkout_redirect_to   = "/wp-admin/options-general.php?page={$slug}";
	$activation_redirect_to = "/wp-admin/{$slug}.php";
	$feature_name           = 'Permalink Settings';

	// Render template
	echo wp_kses(
		wpcom_load_upsell_page_template( $slug, $title, $description, $feature_name, $support_link, $checkout_redirect_to, $activation_redirect_to ),
		UPSELL_PAGE_TEMPLATE_ALLOWED_HTML
	);
}

/**
 * Enqueue styles
 */
function wpcom_upsell_page_enqueue_styles() {
	wp_enqueue_style(
		'wpcom_feature_upsell_permalinks',
		plugins_url( 'upsell-page-styles.css', __FILE__ ),
		array(),
		\Automattic\Jetpack\Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}

/**
 * Upsell pages for missing features on Atomic
 */
function wpcom_permalinks_upsell_page_on_atomic_sites() {
	// Only show the Permalinks upsell on Atomic sites that do not support the feature.
	if ( ! ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) ) {
		return;
	}

	if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
		return;
	}

	// If the site already has the Permalinks feature, do not add the upsell page.
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}

	// Permalinks
	add_submenu_page( 'options-general.php', 'Permalinks', 'Permalinks', 'manage_options', 'options-permalink', 'wpcom_upsell_page_permalink' );
	add_action( 'admin_print_styles-settings_page_options-permalink', 'wpcom_upsell_page_enqueue_styles' );
}

// Add upsell pages to admin menu in Atomic sites
add_action( 'admin_menu', 'wpcom_permalinks_upsell_page_on_atomic_sites' );
