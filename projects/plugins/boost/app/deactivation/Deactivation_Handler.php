<?php

namespace Automattic\Jetpack_Boost\Deactivation;

class Deactivation_Handler {

	public function __construct() {
		add_action( 'admin_init', array( $this, 'enqueue_script' ) );
	}

	public static function init() {
		$instance = new self();
		return $instance;
	}

	public function enqueue_script() {
		wp_enqueue_script(
			'jetpack-boost-deactivation',
			plugins_url( 'assets/deactivation.js', __FILE__ ),
			array(),
			JETPACK_BOOST_VERSION,
			true
		);

		wp_localize_script(
			'jetpack-boost-deactivation',
			'jbDeactivation',
			array(
				'pluginSlug'    => 'jetpack-boost',
				'dialogContent' => $this->get_dialog_content(),
			)
		);

		wp_enqueue_style(
			'jetpack-boost-deactivation',
			plugins_url( 'assets/deactivation.css', __FILE__ ),
			array(),
			JETPACK_BOOST_VERSION
		);
	}

	private function get_dialog_content() {
		ob_start();
		include __DIR__ . '/view.php';
		return ob_get_clean();
	}
}
