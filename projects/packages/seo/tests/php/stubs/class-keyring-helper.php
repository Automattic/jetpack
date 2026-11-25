<?php
/**
 * Test stub for the Publicize package's Keyring_Helper class.
 *
 * The SEO package builds its verify popups' connect URLs through it, but Publicize
 * is provided by the host plugin and isn't installed in the package test context.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\Publicize;

if ( ! class_exists( Keyring_Helper::class ) ) {

	/**
	 * Stub of the Publicize keyring helper.
	 */
	class Keyring_Helper {

		/**
		 * Build a connect URL carrying the service and feature, like the real helper.
		 *
		 * @param string $service_name Service name.
		 * @param string $for          Feature name.
		 * @return string
		 */
		public static function connect_url( $service_name, $for ) {
			return add_query_arg(
				array(
					'action'  => 'request',
					'service' => $service_name,
					'for'     => $for,
				),
				admin_url()
			);
		}
	}
}
