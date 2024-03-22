<?php
/**
 * Contents of the modal displayed when one clicks on the deactivate link for the plugin.
 *
 * This setup relies on the automattic/jetpack-plugin-deactivation package.
 *
 * @package automattic/automattic-for-agencies-client-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
<main class="jp-plugin-deactivation__dialog__content">
	<h1><?php esc_html_e( 'Are you sure you want to disconnect this site?', 'automattic-for-agencies-client' ); ?></h1>
	<p><?php esc_html_e( 'It will no longer show up in the Automattic for Agencies dashboard and you won’t be able to update plugins with one click or be notified of any downtime.', 'automattic-for-agencies-client' ); ?></p>
</main>
<footer class="jp-plugin-deactivation__dialog__actions">
	<button
		type="button"
		class="jp-plugin-deactivation__button"
		data-jp-plugin-deactivation-action="close"
	><?php esc_html_e( 'Keep the site connected', 'automattic-for-agencies-client' ); ?></button>
	<button
		type="button"
		class="jp-plugin-deactivation__button jp-plugin-deactivation__button--destructive"
		data-jp-plugin-deactivation-action="deactivate"
	><?php esc_html_e( 'Yes, disconnect site', 'automattic-for-agencies-client' ); ?></button>
</footer>

<style>
	#jp-plugin-deactivation-automattic-for-agencies-client footer {
		text-align: center;
	}
</style>
