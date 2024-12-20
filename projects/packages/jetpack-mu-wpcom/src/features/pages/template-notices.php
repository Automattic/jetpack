<?php
/**
 * Display notices in the Pages list page when the front page is controlled by the theme templates.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Determines if the current view is the "All" view.
 *
 * Inspired by WP_Posts_List_Table::is_base_request()
 *
 * @return bool Whether the current view is the "All" view.
 */
function wpcom_pages_is_base_request() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	$vars = $_GET;
	unset( $vars['paged'] );

	if ( empty( $vars ) ) {
		return true;
	} elseif ( 1 === count( $vars ) && ! empty( $vars['post_type'] ) ) {
		return 'page' === $vars['post_type'];
	}

	return 1 === count( $vars ) && ! empty( $vars['mode'] );
	// phpcs:enable WordPress.Security.NonceVerification.Recommended
}

/**
 * Displays a notice at the top of the Pages list page if the homepage is controlled by
 * a theme template.
 */
function wpcom_show_homepage_notice() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended
	if ( ! isset( $_GET['post_type'] ) || 'page' !== sanitize_text_field( wp_unslash( $_GET['post_type'] ) ) ) {
		return;
	}

	if ( ! wp_is_block_theme() ) {
		return;
	}

	$show_on_front  = get_option( 'show_on_front' );
	$page_on_front  = get_option( 'page_on_front' );
	$posts_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && ! $page_on_front );
	if ( ! $posts_on_front ) {
		return;
	}

	$is_all_view     = wpcom_pages_is_base_request() || isset( $_REQUEST['all_posts'] );
	$is_publish_view = isset( $_REQUEST['post_status'] ) && 'publish' === $_REQUEST['post_status'];
	$is_private_view = isset( $_REQUEST['post_status'] ) && 'private' === $_REQUEST['post_status'];

	if ( ! $is_all_view && ! $is_publish_view && ! $is_private_view ) {
		return;
	}

	if ( isset( $_REQUEST['s'] ) ) {
		$search = sanitize_text_field( wp_unslash( $_REQUEST['s'] ) );
		if ( ! str_contains( strtolower( __( 'Homepage', 'jetpack-mu-wpcom' ) ), strtolower( $search ) ) ) {
			return;
		}
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended
	?>
	<template id="wpcom-homepate-notice-template">
		<div class="wpcom-homepage-notice card">
			<div class="icon">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
					<path d="M12 4L4 7.9V20h16V7.9L12 4zm6.5 14.5H14V13h-4v5.5H5.5V8.8L12 5.7l6.5 3.1v9.7z" />
				</svg>
			</div>
			<div>
				<h2><?php esc_html_e( 'Homepage', 'jetpack-mu-wpcom' ); ?></h2>
				<p><?php esc_html_e( 'Your homepage uses the Blog Home template', 'jetpack-mu-wpcom' ); ?></p>
			</div>
		</div>
	</template>
	<style>
		.wpcom-homepage-notice {
			clear: both;
			max-width: none;
			min-width: auto;
			padding: 1.5em;
			display: flex;
			align-items: center;
			gap: 16px;
		}

		.wpcom-homepage-notice h2,
		.wpcom-homepage-notice p {
			margin: 0;
		}

		.wpcom-homepage-notice h2 {
			margin-bottom: 0.25em;
		}

		.wpcom-homepage-notice svg {
			width: 24px;
			height: 24px;
		}
	</style>
	<script type="text/javascript">
		document.addEventListener( 'DOMContentLoaded', function() {
			const template = document.getElementById( 'wpcom-homepate-notice-template' );
			const notice = template.content.cloneNode( true );
			const tablenav = document.querySelector( '#posts-filter .tablenav.top' );
			if ( ! tablenav ) {
				return;
			}
			tablenav.parentNode.insertBefore( notice, tablenav );
		} );
	</script>
	<?php
}
add_action( 'admin_print_footer_scripts-edit.php', 'wpcom_show_homepage_notice' );
