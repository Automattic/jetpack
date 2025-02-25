<?php
/**
 * Prevent site owner from editing user's account-level fields.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../../utils.php';

/**
 * Load the assets of the wpcom-user-edit.
 */
function load_wpcom_user_edit() {
	// Do nothing if the user is not connected to WordPress.com.
	// if ( ! is_current_user_connected() ) {
	// return;
	// }

	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-user-edit', array( 'js', 'css' ) );

	$data = wp_json_encode(
		array(
			'fields' => array(
				'language'    => array(
					'selector'    => '#locale',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'firstName'   => array(
					'selector'    => '#first_name',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'lastName'    => array(
					'selector'    => '#last_name',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'nickname'    => array(
					'selector'    => '#nickname',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'displayName' => array(
					'selector'    => '#display_name',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'website'     => array(
					'selector'    => '#url',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'bio'         => array(
					'selector'    => '#description',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
				'email'       => array(
					'selector'    => '#email',
					'description' => __( 'It cannot be changed.', 'jetpack-mu-wpcom' ),
					'disabled'    => true,
				),
			),
		)
	);

	wp_add_inline_script(
		$handle,
		"window.JETPACK_MU_WPCOM_USER_EDIT = $data;",
		'before'
	);
}
add_action( 'load-user-edit.php', __NAMESPACE__ . '\load_wpcom_user_edit' );
