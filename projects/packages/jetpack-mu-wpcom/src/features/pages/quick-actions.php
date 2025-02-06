<?php
/**
 * Quick actions for the Pages list page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds quick actions to change the homepage and post page.
 *
 * @param string[] $actions An array of action links to be displayed.
 * @param WP_Post  $page Page object.
 *
 * @return string[] Filtered actions.
 */
function wpcom_page_quick_actions( $actions, $page ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return $actions;
	}

	if ( $page->post_status !== 'publish' ) {
		return $actions;
	}

	$homepage_id         = (int) get_option( 'page_on_front' );
	$posts_page_id       = (int) get_option( 'page_for_posts' );
	$has_static_homepage = 'page' === get_option( 'show_on_front' ) && (bool) $homepage_id;
	$is_homepage         = $page->ID === $homepage_id;
	$is_posts_page       = $page->ID === $posts_page_id;

	if ( ! $has_static_homepage || $is_homepage ) {
		return $actions;
	}

	$set_homepage_action   = 'set-homepage';
	$set_posts_page_action = 'set-posts-page';

	$cleaned_current_url = remove_query_arg( array( $set_homepage_action, $set_posts_page_action, '_wpnonce' ) );

	$set_homepage_link = add_query_arg( $set_homepage_action, $page->ID, $cleaned_current_url );
	$set_homepage_link = wp_nonce_url( $set_homepage_link, $set_homepage_action . '_' . $page->ID );

	$actions[ $set_homepage_action ] = sprintf(
		'<a href="%1$s" aria-label="%2$s">%3$s</a>',
		esc_url( $set_homepage_link ),
		/* translators: page title */
		esc_attr( sprintf( __( 'Set &#8220;%s&#8221; as your site\'s homepage', 'jetpack-mu-wpcom' ), $page->post_title ) ),
		esc_html( __( 'Set as homepage', 'jetpack-mu-wpcom' ) )
	);

	$new_posts_page = $is_posts_page ? 0 : $page->ID;

	$set_posts_page_link = add_query_arg( $set_posts_page_action, $new_posts_page, $cleaned_current_url );
	$set_posts_page_link = wp_nonce_url( $set_posts_page_link, $set_posts_page_action . '_' . $new_posts_page );
	/* translators: page title */
	$set_posts_page_label = $is_posts_page ? sprintf( __( 'Unset &#8220;%s&#8221; as the page that displays your latest posts', 'jetpack-mu-wpcom' ), $page->post_title ) : sprintf( __( 'Set &#8220;%s&#8221; as the page that displays your latest posts', 'jetpack-mu-wpcom' ), $page->post_title );
	$set_posts_page_text  = $is_posts_page ? __( 'Unset as posts page', 'jetpack-mu-wpcom' ) : __( 'Set as posts page', 'jetpack-mu-wpcom' );

	$actions[ $set_posts_page_action ] = sprintf(
		'<a href="%1$s" aria-label="%2$s">%3$s</a>',
		esc_url( $set_posts_page_link ),
		esc_attr( $set_posts_page_label ),
		esc_html( $set_posts_page_text )
	);

	return $actions;
}
add_filter( 'page_row_actions', 'wpcom_page_quick_actions', 10, 2 );

/**
 * Checks if the current request can perform a quick action valid for a given page.
 *
 * @param string $action Action name ('set-homepage', 'set-posts-page').
 *
 * @return false|int The page ID is the request is valid, false otherwise.
 */
function wpcom_validate_quick_action( $action ) {
	global $pagenow;

	if ( 'edit.php' !== $pagenow ) {
		return false;
	}

	if ( ! isset( $_GET['post_type'] ) || 'page' !== sanitize_text_field( wp_unslash( $_GET['post_type'] ) ) ) {
		return false;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	if ( ! isset( $_GET[ $action ] ) ) {
		return false;
	}

	$page_id = sanitize_text_field( wp_unslash( $_GET[ $action ] ) );
	if ( ! is_numeric( $page_id ) ) {
		return false;
	}

	check_admin_referer( $action . '_' . $page_id );

	$homepage_id         = (int) get_option( 'page_on_front' );
	$has_static_homepage = 'page' === get_option( 'show_on_front' ) && (bool) $homepage_id;

	if ( ! $has_static_homepage ) {
		return false;
	}

	$page_id = (int) $page_id;

	if ( $action === 'set-posts-page' && $page_id === 0 ) {
		return $page_id;
	}

	if ( $page_id === $homepage_id ) {
		return false;
	}

	$page = get_post( $page_id );
	if ( ! ( $page instanceof WP_Post ) || $page->post_type !== 'page' || $page->post_status !== 'publish' ) {
		return false;
	}

	return $page_id;
}

/**
 * Changes the homepage.
 */
function wpcom_set_homepage() {
	$new_homepage_id = wpcom_validate_quick_action( 'set-homepage' );
	if ( ! is_int( $new_homepage_id ) ) {
		return;
	}

	update_option( 'page_on_front', $new_homepage_id );

	add_action(
		'admin_notices',
		function () {
			wp_admin_notice(
				__( 'Homepage changed successfully.', 'jetpack-mu-wpcom' ),
				array(
					'type'        => 'success',
					'dismissible' => true,
				)
			);
		}
	);
}
add_action( 'init', 'wpcom_set_homepage', 0 ); // Before masterbar_init_wp_posts_list

/**
 * Changes the posts_page.
 */
function wpcom_set_posts_page() {
	$new_posts_page_id = wpcom_validate_quick_action( 'set-posts-page' );
	if ( ! is_int( $new_posts_page_id ) ) {
		return;
	}

	update_option( 'page_for_posts', $new_posts_page_id );

	add_action(
		'admin_notices',
		function () {
			wp_admin_notice(
				__( 'Posts page changed successfully.', 'jetpack-mu-wpcom' ),
				array(
					'type'        => 'success',
					'dismissible' => true,
				)
			);
		}
	);
}
add_action( 'init', 'wpcom_set_posts_page', 0 ); // Before masterbar_init_wp_posts_list
