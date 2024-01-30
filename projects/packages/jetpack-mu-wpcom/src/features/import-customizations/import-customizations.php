<?php
/**
 * Customizations to the wp-admin/import.php page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( $GLOBALS['pagenow'] === 'import.php' ) {
	echo '<div class="notice notice-success is-dismissible">';
	echo '<p>Effortlessly import your content with <a href="">WordPress.com’s guided importer</a>. Designed for seamless integration from multiple platforms. <a href="">Learn more and get started</a>.</p>';
	echo '</div>';
}
