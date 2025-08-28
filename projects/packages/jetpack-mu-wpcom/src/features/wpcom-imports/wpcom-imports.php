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

	register_importer( 'wpcom-squarespace', __( 'Squarespace', 'jetpack-mu-wpcom' ), $squarespace_description, $page );
	register_importer( 'wpcom-medium', __( 'Medium', 'jetpack-mu-wpcom' ), $medium_description, $page );
	register_importer( 'wpcom-wix', __( 'Wix', 'jetpack-mu-wpcom' ), $wix_description, $page );
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
