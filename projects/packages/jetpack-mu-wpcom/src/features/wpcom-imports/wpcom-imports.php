<?php
/**
 * Register Calypso import entries in WP-Admin/import.php
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare(strict_types=1);

/**
 * Register the imports.
 *
 * WPCOM Simple has a custom filter for the url. However, that filter is not available on AT.
 * To avoid having duplicate implementations, the implementation uses a redirect.
 *
 * @return void
 */
function wpcom_imports_register_imports() {
	$page = function () { };

	$squarespace_description = __( 'Import <strong>posts, comments, images and tags</strong> from a Squarespace export file.', 'jetpack-mu-wpcom' );
	$medium_description      = __( 'Import <strong>posts</strong> from a Medium export file.', 'jetpack-mu-wpcom' );
	$wix_description         = __( 'Import <strong>posts, pages, and media</strong> from your Wix.com site.', 'jetpack-mu-wpcom' );
	$substack_description    = __( 'Import <strong>content and subscribers</strong> from your Substack site.', 'jetpack-mu-wpcom' );

	register_importer( 'wpcom-squarespace', __( 'Squarespace', 'jetpack-mu-wpcom' ), $squarespace_description, $page );
	register_importer( 'wpcom-medium', __( 'Medium', 'jetpack-mu-wpcom' ), $medium_description, $page );
	register_importer( 'wpcom-wix', __( 'Wix', 'jetpack-mu-wpcom' ), $wix_description, $page );
	register_importer( 'wpcom-substack', __( 'Substack', 'jetpack-mu-wpcom' ), $substack_description, $page );
}

add_action( 'admin_init', 'wpcom_imports_register_imports' );

/**
 * Redirect to Calypso Stepper Squarespace importer.
 */
add_action(
	'load-importer-wpcom-squarespace',
	/**
	 * Redirect to the Squarespace importer in the Calypso Stepper.
	 *
	 * @return never-return
	 */
	function () {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		wp_redirect( 'https://wordpress.com/setup/site-setup/importerSquarespace?ref=wp-admin-importers-list-direct-importer&siteSlug=' . $domain );
		exit();
	}
);

/**
 * Redirect to Calypso Stepper Medium importer.
 */
add_action(
	'load-importer-wpcom-medium',
	/**
	 * Redirect to the Medium importer in the Calypso Stepper.
	 *
	 * @return never-return
	 */
	function () {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		wp_redirect( 'https://wordpress.com/setup/site-setup/importerMedium?ref=wp-admin-importers-list-direct-importer&siteSlug=' . $domain );
		exit();
	}
);

/**
 * Redirect to Calypso Stepper Wix importer
 */
add_action(
	'load-importer-wpcom-wix',
	/**
	 * Redirect to the Wix importer in the Calypso Stepper.
	 *
	 * @return never-return
	 */
	function () {
		$domain  = wp_parse_url( home_url(), PHP_URL_HOST );
		$site_id = get_wpcom_blog_id();
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		wp_redirect( 'https://wordpress.com/setup/site-migration/site-migration-identify?platform=wix&action=skip_platform_identification&hide_importer_link=true&siteSlug=' . $domain . '&siteId=' . $site_id );
		exit();
	}
);

/**
 * Redirect to Calypso Stepper Substack importer.
 */
add_action(
	'load-importer-wpcom-substack',
	/**
	 * Redirect to the Substack importer in the Calypso Stepper.
	 *
	 * @return never-return
	 */
	function () {
		$domain = wp_parse_url( home_url(), PHP_URL_HOST );
		// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
		wp_redirect( 'https://wordpress.com/setup/site-setup/importerSubstack?ref=wp-admin-importers-list-direct-importer&siteSlug=' . $domain );
		exit();
	}
);

/**
 * Update the WordPress importer URL to point to the Calypso Stepper importer.
 *
 * @param string $url the Importer URL.
 * @param string $importer_type The type of the importer (e.g. WordPress).
 *
 * @return string
 */
function wpcom_import_update_wordpress_url_on_simple( $url, $importer_type ) {
	// @phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
	if ( 'wordpress' !== $importer_type ) {
		return $url;
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );

	return 'https://wordpress.com/setup/site-setup/importerWordpress?ref=wp-admin-importers-list-direct-importer&siteSlug=' . $domain;
}

/**
 * Although the hook is prefixed with wp_*, it's actually a custom WPCOM one that's only executed on Simple Sites.
 */
add_action( 'wp_import_run_import_url_filter', 'wpcom_import_update_wordpress_url_on_simple', 11, 2 );

/**
 * Enqueue the wpcom importer entry script.
 */
function wpcom_imports_enqueue_script() {
	wp_enqueue_script(
		'wpcom-importer-entry',
		plugins_url( 'wpcom-importer-entry.js', __FILE__ ),
		array( 'wp-i18n', 'wp-dom-ready' ),
		'1.0.1',
		true
	);

	wp_set_script_translations( 'wpcom-importer-entry', 'jetpack-mu-wpcom' );

	$domain  = wp_parse_url( home_url(), PHP_URL_HOST );
	$site_id = get_wpcom_blog_id();

	$url = 'https://wordpress.com/setup/site-migration/site-migration-identify?hide_importer_link=true&siteSlug=' . $domain . '&siteId=' . $site_id;

	wp_add_inline_script(
		'wpcom-importer-entry',
		'const wpcomImporterData = ' . wp_json_encode(
			array(
				'wpcomImporterUrl' => $url,
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		) . ';',
		'before'
	);
}

add_action( 'admin_print_styles-import.php', 'wpcom_imports_enqueue_script' );
