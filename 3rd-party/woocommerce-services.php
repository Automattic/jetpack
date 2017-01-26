<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WC_Services_Installer {

	public function try_install() {
		$action = filter_input( INPUT_GET, 'wc-services-action' );

		if ( 'install' === $action ) {
			check_admin_referer( 'wc-services-install' );

			$this->install();

			wp_safe_redirect( remove_query_arg( array( 'wc-services-action', '_wpnonce' ) ) );

			exit;
		}
	}

	private function install() {
		include_once( ABSPATH . '/wp-admin/includes/admin.php' );
		include_once( ABSPATH . '/wp-admin/includes/plugin-install.php' );
		include_once( ABSPATH . '/wp-admin/includes/plugin.php' );
		include_once( ABSPATH . '/wp-admin/includes/class-wp-upgrader.php' );
		include_once( ABSPATH . '/wp-admin/includes/class-plugin-upgrader.php' );

		$api = plugins_api( 'plugin_information', array(
			'slug'   => 'connect-for-woocommerce',
		) );

		if ( is_wp_error( $api ) ) {
			wp_die( $api );
		}

		$upgrader = new Plugin_Upgrader( new Automatic_Upgrader_Skin() );
		$result   = $upgrader->install( $api->download_link );

		if ( is_wp_error( $result ) ) {
			wp_die( $result );
		}

		$result = activate_plugin( 'connect-for-woocommerce/woocommerce-connect-client.php' );

		if ( is_wp_error( $result ) ) {
			wp_die( $result );
		}
	}
}

$wc_services_installer = new WC_Services_Installer();

add_action( 'init', array( $wc_services_installer, 'try_install' ) );
