<?php
/**
 * Quick actions for the categories list page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a quick action to change the default post category.
 *
 * @param string[] $actions An array of action links to be displayed.
 * @param WP_Term  $category Category object.
 *
 * @return string[] Filtered actions.
 */
function wpcom_add_set_default_category_quick_action( $actions, $category ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return $actions;
	}

	$default_category = (int) get_option( 'default_category' );
	if ( $category->term_id === $default_category ) {
		return $actions;
	}

	$action = 'set-default';

	$link = add_query_arg( array( $action => $category->term_id ) );
	$link = wp_nonce_url( $link, $action . '_' . $category->term_id );

	$actions[ $action ] = sprintf(
		'<a href="%1$s" aria-label="%2$s">%3$s</a>',
		esc_url( $link ),
		/* translators: category name */
		esc_attr( sprintf( __( 'Set &#8220;%s&#8221; as the default category', 'jetpack-mu-wpcom' ), $category->name ) ),
		esc_html( __( 'Set as default', 'jetpack-mu-wpcom' ) )
	);
	return $actions;
}
add_filter( 'category_row_actions', 'wpcom_add_set_default_category_quick_action', 10, 2 );

/**
 * Changes the default post category.
 */
function wpcom_set_default_category() {
	if ( ! isset( $_GET['taxonomy'] ) || 'category' !== sanitize_text_field( wp_unslash( $_GET['taxonomy'] ) ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$action = 'set-default';

	if ( ! isset( $_GET[ $action ] ) ) {
		return;
	}

	$category_id = sanitize_text_field( wp_unslash( $_GET[ $action ] ) );
	if ( ! is_numeric( $category_id ) ) {
		return;
	}

	check_admin_referer( $action . '_' . $category_id );

	$category = get_category( (int) $category_id );
	if ( is_wp_error( $category ) || ! $category ) {
		return;
	}

	update_option( 'default_category', $category->term_id );

	add_action(
		'admin_notices',
		function () {
			wp_admin_notice(
				__( 'Default category changed successfully.', 'jetpack-mu-wpcom' ),
				array(
					'type'        => 'success',
					'dismissible' => true,
				)
			);
		}
	);
}
add_action( 'load-edit-tags.php', 'wpcom_set_default_category' );
