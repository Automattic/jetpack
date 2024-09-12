<?php
/**
 * Block Editor - Sharing feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing;

use Jetpack_Gutenberg;

/**
 * Register Sharing plugin.
 *
 * @return void
 */
function register_plugins() {
	// Register Sharing.
	Jetpack_Gutenberg::set_extension_available( 'sharing' );
}

add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugins' );

/**
 * The Sharing panel is only displayed for post types that support sharing.
 * The sharing module declares support for sharing for all the public post types.
 * Let's do the same thing when the module isn't active yet.
 */
add_action(
	'rest_api_init',
	function () {
		if ( ! \Jetpack::is_module_active( 'sharedaddy' ) ) {
			$post_types = get_post_types( array( 'public' => true ) );

			foreach ( $post_types as $post_type ) {
				register_rest_field(
					$post_type,
					'jetpack_sharing_enabled',
					array(
						'get_callback' => function ( array $post ) {
							if ( ! isset( $post['id'] ) ) {
								return false;
							}

							return (bool) ! get_post_meta( $post['id'], 'sharing_disabled', true );
						},
						'schema'       => array(
							'description' => __( 'Are sharing buttons enabled?', 'jetpack' ),
							'type'        => 'boolean',
						),
					)
				);
				add_post_type_support( $post_type, 'jetpack-sharing-buttons' );
			}
		}
	}
);
