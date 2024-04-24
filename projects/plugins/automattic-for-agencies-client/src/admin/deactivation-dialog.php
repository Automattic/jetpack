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
	#jp-plugin-deactivation-automattic-for-agencies-client .jp-plugin-deactivation__dialog {
		height: fit-content;
		width: calc(100% - 32px);
		
		max-width: 512px;

		border-radius: 12px;
	}
	
	#jp-plugin-deactivation-automattic-for-agencies-client .jp-plugin-deactivation__dialog__content {
		background: none;

		align-items: start;

		padding: 2rem 2rem 0;
	}

	#jp-plugin-deactivation-automattic-for-agencies-client .jp-plugin-deactivation__dialog__content h1 {
		font-size: 20px;
		line-height: 24px;

		margin: 0;
	}

	#jp-plugin-deactivation-automattic-for-agencies-client .jp-plugin-deactivation__dialog__content p {
		font-size: 14px;
		line-height: 20px;

		margin: 2rem 0;
	}

	#jp-plugin-deactivation-automattic-for-agencies-client footer {
		font-weight: 600;

		text-align: right;
		border: none;

		padding: 0 2rem 2rem;
	}

	#jp-plugin-deactivation-automattic-for-agencies-client footer .jp-plugin-deactivation__button:first-child {
		color: var(--btn-color);
		background: none;
		border: 1px solid var(--Gray-Gray-5, #DCDCDE);
		border-radius: 4px;
	}

	#jp-plugin-deactivation-automattic-for-agencies-client footer .jp-plugin-deactivation__button:last-child {
		border-radius: 4px;
		background: var(--Red-Red-60, #B32D2E);
	}
</style>
