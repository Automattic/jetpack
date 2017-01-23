<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WC_Services_Installer {

	public function notice() {
		$this->try_install();
		$link = add_query_arg( array( 'wc-services-action' => 'install' ) );
?>
		<div class="notice notice-warning">
			<p>
				Hello World. <a href="<?php echo $link; ?>">install</a>
			</p>
		</div>
<?php
	}

	public function try_install() {
		$install = filter_input( INPUT_GET, 'wc-services-action' );
		if ( 'install' === $install ) {
			$this->install();
			wp_redirect( esc_url_raw( remove_query_arg( array( 'wc-services-action' ) ) ) );
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
add_action( 'admin_notices', array( $wc_services_installer, 'notice' ) );
