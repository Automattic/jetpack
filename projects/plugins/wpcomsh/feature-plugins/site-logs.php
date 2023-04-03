<?php
/**
 * Site Logs feature, see `/site-logs/:siteSlug` in Calypso.
 *
 * @package wpcomsh
 */

add_filter( 'jetpack_show_wpcom_site_logs_menu', '__return_true' );
